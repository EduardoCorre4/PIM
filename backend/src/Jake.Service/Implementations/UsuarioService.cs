using Jake.Domain.DTOs;
using Jake.Domain.Enums;
using Jake.Repository.Interfaces;
using Jake.Service.Interfaces;

namespace Jake.Service.Implementations;

public class UsuarioService(IUsuarioRepository usuarios) : IUsuarioService
{
    public async Task<List<UsuarioResponse>> ListarAsync(PerfilUsuario? perfil) =>
        (await usuarios.ListarAsync(perfil)).Select(u => new UsuarioResponse(u.Id, u.Nome, u.Email, u.Perfil)).ToList();
}
