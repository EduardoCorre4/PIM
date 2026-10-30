using System.Text;
using System.Threading.RateLimiting;
using Jake.Api.Middleware;
using Jake.Domain.DTOs;
using Jake.Domain.Enums;
using Jake.Repository;
using Jake.Repository.Context;
using Jake.Service;
using Jake.Service.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

var jwt = builder.Configuration.GetSection(JwtSettings.Section).Get<JwtSettings>() ?? new JwtSettings();
if (jwt.Key.Length < 32)
    throw new InvalidOperationException("Jwt:Key deve ter ao menos 32 caracteres (defina via variável de ambiente ou user-secrets).");
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.Section));

builder.Services
    .AddRepositories(builder.Configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException("ConnectionStrings:Default não configurada."))
    .AddServices();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, ValidIssuer = jwt.Issuer,
            ValidateAudience = true, ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();

// Saúde: /health/live (processo no ar) e /health/ready (inclui o banco). Usados por orquestrador e balanceador.
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>("banco", tags: ["ready"]);

// Atrás de proxy/balanceador, o IP real do cliente vem em X-Forwarded-For. Só habilite quando a API NÃO
// estiver exposta diretamente à internet (senão o cabeçalho poderia ser forjado).
if (builder.Configuration.GetValue("ForwardedHeaders:Enabled", false))
{
    builder.Services.Configure<ForwardedHeadersOptions>(o =>
    {
        o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        o.KnownNetworks.Clear();
        o.KnownProxies.Clear();
    });
}

// Limite de tentativas por IP nas rotas de autenticação (proteção contra força bruta).
var limiteAuth = builder.Configuration.GetValue("RateLimit:AuthPerMinute", 10);
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.OnRejected = async (ctx, ct) =>
    {
        ctx.HttpContext.Response.Headers.RetryAfter = "60";
        await ctx.HttpContext.Response.WriteAsJsonAsync(
            new ProblemDetails { Status = 429, Title = "Muitas tentativas. Aguarde um minuto e tente de novo." }, ct);
    };
    o.AddPolicy("auth", http => RateLimitPartition.GetFixedWindowLimiter(
        http.Connection.RemoteIpAddress?.ToString() ?? "desconhecido",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = limiteAuth, Window = TimeSpan.FromMinutes(1) }));
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = []
    });
});

var app = builder.Build();

// Aplica migrations e cria o Gerente inicial (se configurado e se não houver usuários).
if (builder.Configuration.GetValue("Database:MigrateOnStartup", false))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    var seed = builder.Configuration.GetSection("SeedGerente");
    if (!await db.Usuarios.AnyAsync() && !string.IsNullOrEmpty(seed["Email"]) && !string.IsNullOrEmpty(seed["Senha"]))
    {
        await scope.ServiceProvider.GetRequiredService<IAuthService>().RegistrarAsync(
            new RegistrarUsuarioRequest(seed["Nome"] ?? "Gerente", seed["Email"]!, seed["Senha"]!, PerfilUsuario.Gerente));
    }

    // Gerentes da equipe (demonstração): criados apenas se o e-mail ainda não existir.
    var auth = scope.ServiceProvider.GetRequiredService<IAuthService>();
    foreach (var (nome, email) in new[] { ("Eduardo", "eduardo@jake.local"), ("Jheniffer", "jheniffer@jake.local"),
                 ("Karolaine", "karolaine@jake.local"), ("Arthur", "arthur@jake.local"), ("Emy", "emy@jake.local") })
    {
        if (!await db.Usuarios.AnyAsync(u => u.Email == email))
            await auth.RegistrarAsync(new RegistrarUsuarioRequest(nome, email, "Gerente@123", PerfilUsuario.Gerente));
    }

    // Funcionário de demonstração: criado uma vez, mesmo em banco que já tenha usuários.
    var seedFunc = builder.Configuration.GetSection("SeedFuncionario");
    if (!string.IsNullOrEmpty(seedFunc["Email"]) && !string.IsNullOrEmpty(seedFunc["Senha"])
        && !await db.Usuarios.AnyAsync(u => u.Email == seedFunc["Email"]!.Trim().ToLower()))
    {
        await scope.ServiceProvider.GetRequiredService<IAuthService>().RegistrarAsync(
            new RegistrarUsuarioRequest(seedFunc["Nome"] ?? "Funcionário", seedFunc["Email"]!, seedFunc["Senha"]!, PerfilUsuario.Funcionario));
    }
}

if (builder.Configuration.GetValue("ForwardedHeaders:Enabled", false)) app.UseForwardedHeaders();

// Cabeçalhos de segurança. Respostas da API não devem ser guardadas em cache (contêm tokens e dados pessoais).
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    ctx.Response.Headers["Cache-Control"] = "no-store";
    await next();
});

app.UseMiddleware<ExceptionHandlingMiddleware>();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new() { Predicate = r => r.Tags.Contains("ready") });
app.Run();
