using Jake.Domain.Entities;

namespace Jake.Repository.Interfaces;

public interface IRefreshTokenRepository
{
    Task AdicionarAsync(RefreshToken token);
    Task<RefreshToken?> ObterPorHashAsync(string hash);
    Task SalvarAsync(RefreshToken token);
    Task RevogarTodosDoUsuarioAsync(int usuarioId);
}
