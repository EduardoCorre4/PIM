using Jake.Domain.Entities;
using Jake.Repository.Context;
using Jake.Repository.Interfaces;

namespace Jake.Repository.Implementations;

public class LogAcessoRepository(AppDbContext db) : ILogAcessoRepository
{
    public async Task AdicionarAsync(LogAcesso log)
    {
        db.LogsAcesso.Add(log);
        await db.SaveChangesAsync();
    }
}
