using Jake.Domain.DTOs;
using Jake.Domain.Enums;

namespace Jake.Service.Interfaces;

public interface IUsuarioService
{
    Task<List<UsuarioResponse>> ListarAsync(PerfilUsuario? perfil);
}
