using Jake.Domain.Entities;
using Jake.Domain.Enums;

namespace Jake.Repository.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> ObterPorIdAsync(int id);
    Task<Usuario?> ObterPorEmailAsync(string email);
    Task<bool> EmailExisteAsync(string email);
    Task AdicionarAsync(Usuario usuario);
    Task<List<Usuario>> ListarAsync(PerfilUsuario? perfil = null);
}
