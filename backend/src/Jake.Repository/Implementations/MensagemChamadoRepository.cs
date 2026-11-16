using Jake.Domain.Entities;
using Jake.Repository.Context;
using Jake.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Jake.Repository.Implementations;

public class MensagemChamadoRepository(AppDbContext db) : IMensagemChamadoRepository
{
    public Task<List<MensagemChamado>> ListarAsync(int chamadoId) =>
        db.MensagensChamado.AsNoTracking().Where(m => m.ChamadoId == chamadoId)
            .OrderBy(m => m.DataEnvio).ThenBy(m => m.Id).ToListAsync();

    public async Task AdicionarAsync(MensagemChamado mensagem)
    {
        db.MensagensChamado.Add(mensagem);
        await db.SaveChangesAsync();
    }
}
