using Jake.Domain.Entities;
using Jake.Repository.Context;
using Jake.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Jake.Repository.Implementations;

public class RefreshTokenRepository(AppDbContext db) : IRefreshTokenRepository
{
    public async Task AdicionarAsync(RefreshToken token)
    {
        db.RefreshTokens.Add(token);
        await db.SaveChangesAsync();
    }

    public Task<RefreshToken?> ObterPorHashAsync(string hash) =>
        db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);

    public Task SalvarAsync(RefreshToken token) => db.SaveChangesAsync();

    public Task RevogarTodosDoUsuarioAsync(int usuarioId) =>
        db.RefreshTokens.Where(t => t.UsuarioId == usuarioId && t.RevogadoEm == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevogadoEm, DateTime.UtcNow));
}
