using Jake.Repository.Context;
using Jake.Repository.Implementations;
using Jake.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Jake.Repository;

public static class DependencyInjection
{
    public static IServiceCollection AddRepositories(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<AppDbContext>(o =>
            o.UseSqlServer(connectionString, s => s.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IContratoRepository, ContratoRepository>();
        services.AddScoped<IChamadoRepository, ChamadoRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<ILogAcessoRepository, LogAcessoRepository>();
        return services;
    }
}
