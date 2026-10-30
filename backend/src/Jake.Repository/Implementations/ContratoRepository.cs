using Jake.Domain.Entities;
using Jake.Domain.Enums;
using Jake.Repository.Context;
using Jake.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Jake.Repository.Implementations;

public class ContratoRepository(AppDbContext db) : IContratoRepository
{
    public Task<List<Contrato>> ListarAsync() =>
        db.Contratos.AsNoTracking().Include(c => c.Cliente).OrderBy(c => c.Id).ToListAsync();

    public Task<List<Contrato>> ListarPorClienteAsync(int clienteId) =>
        db.Contratos.AsNoTracking().Where(c => c.ClienteId == clienteId).OrderBy(c => c.Id).ToListAsync();

    public Task<Contrato?> ObterPorIdAsync(int id) =>
        db.Contratos.Include(c => c.Cliente).FirstOrDefaultAsync(c => c.Id == id);

    public Task<bool> NumeroExisteAsync(string numero, int? ignorarId = null) =>
        db.Contratos.AnyAsync(c => c.Numero == numero && c.Id != ignorarId);

    public async Task AdicionarAsync(Contrato contrato)
    {
        db.Contratos.Add(contrato);
        await db.SaveChangesAsync();
    }

    public async Task AtualizarAsync(Contrato contrato)
    {
        db.Contratos.Update(contrato);
        await db.SaveChangesAsync();
    }

    public async Task RemoverAsync(Contrato contrato)
    {
        db.Contratos.Remove(contrato);
        await db.SaveChangesAsync();
    }

    public async Task<Dictionary<StatusContrato, int>> ContarPorStatusAsync() =>
        await db.Contratos.GroupBy(c => c.Status).ToDictionaryAsync(g => g.Key, g => g.Count());

    public Task<int> ContarAtivosVencendoAsync(DateTime hoje, int dias) =>
        db.Contratos.CountAsync(c => c.Status == StatusContrato.Ativo && c.DataFim >= hoje && c.DataFim <= hoje.AddDays(dias));

    public Task<bool> PossuiChamadosAsync(int contratoId) => db.Chamados.AnyAsync(c => c.ContratoId == contratoId);

    /// <summary>Contratos ativos cuja vigência já terminou: candidatos a encerramento.</summary>
    public Task<int> ContarAtivosVencidosAsync(DateTime hoje) =>
        db.Contratos.CountAsync(c => c.Status == StatusContrato.Ativo && c.DataFim < hoje);

    public Task<List<Contrato>> ListarFiltradoAsync(StatusContrato? status, DateTime? venceAte, DateTime hoje) =>
        db.Contratos.AsNoTracking().Include(c => c.Cliente)
            .Where(c => (status == null || c.Status == status)
                        && (venceAte == null || (c.DataFim >= hoje && c.DataFim <= venceAte)))
            .OrderBy(c => c.DataFim).ThenBy(c => c.Numero)
            .ToListAsync();
}
