using Jake.Service.Implementations;
using Jake.Service.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace Jake.Service;

public static class DependencyInjection
{
    public static IServiceCollection AddServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IContratoService, ContratoService>();
        services.AddScoped<IUsuarioService, UsuarioService>();
        services.AddScoped<IChamadoService, ChamadoService>();
        services.AddScoped<IPainelService, PainelService>();
        services.AddScoped<IRelatorioService, RelatorioService>();
        return services;
    }
}
