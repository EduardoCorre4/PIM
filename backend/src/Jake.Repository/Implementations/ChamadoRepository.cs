using System.Data;
using Jake.Domain;
using Jake.Domain.Entities;
using Jake.Domain.Enums;
using Jake.Repository.Context;
using Jake.Repository.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Jake.Repository.Implementations;

public class ChamadoRepository(AppDbContext db) : IChamadoRepository
{
    public async Task<int> AbrirAsync(int contratoId, int clienteId, string titulo, string descricao, string? chaveIdempotencia)
    {
        var novoId = new SqlParameter("@ChamadoId", SqlDbType.Int) { Direction = ParameterDirection.Output };
        try
        {
            await db.Database.ExecuteSqlRawAsync(
                "EXEC dbo.sp_AbrirChamado @ContratoId, @ClienteId, @Titulo, @Descricao, @ChaveIdempotencia, @ChamadoId OUTPUT",
                new SqlParameter("@ContratoId", contratoId),
                new SqlParameter("@ClienteId", clienteId),
                new SqlParameter("@Titulo", titulo),
                new SqlParameter("@Descricao", descricao),
                new SqlParameter("@ChaveIdempotencia", (object?)chaveIdempotencia ?? DBNull.Value),
                novoId);
        }
        // Erros 50001-50004 são as regras de negócio lançadas pela procedure (THROW).
        catch (SqlException ex) when (ex.Number == 50001)
        {
            throw new NaoEncontradoException(ex.Message);
        }
        catch (SqlException ex) when (ex.Number is >= 50002 and <= 50004)
        {
            throw new RegraNegocioException(ex.Message);
        }
        return (int)novoId.Value;
    }

    public Task<Chamado?> ObterPorChaveAsync(int clienteId, string chaveIdempotencia) =>
        db.Chamados.Include(c => c.Contrato).Include(c => c.Cliente)
            .FirstOrDefaultAsync(c => c.ClienteId == clienteId && c.ChaveIdempotencia == chaveIdempotencia);

    public Task<Chamado?> ObterPorIdAsync(int id) =>
        db.Chamados.Include(c => c.Contrato).Include(c => c.Cliente).FirstOrDefaultAsync(c => c.Id == id);

    public Task<List<Chamado>> ListarAsync(StatusChamado? status = null, int? clienteId = null) =>
        db.Chamados.AsNoTracking().Include(c => c.Contrato).Include(c => c.Cliente)
            .Where(c => (status == null || c.Status == status) && (clienteId == null || c.ClienteId == clienteId))
            .OrderByDescending(c => c.DataAbertura)
            .ToListAsync();

    public async Task AtualizarAsync(Chamado chamado)
    {
        db.Chamados.Update(chamado);
        await db.SaveChangesAsync();
    }

    public async Task<Dictionary<StatusChamado, int>> ContarPorStatusAsync() =>
        await db.Chamados.GroupBy(c => c.Status).ToDictionaryAsync(g => g.Key, g => g.Count());

    public Task<List<Chamado>> ListarFiltradoAsync(DateTime? de, DateTime? ateExclusivo, StatusChamado? status, int? contratoId, int? clienteId) =>
        db.Chamados.AsNoTracking().Include(c => c.Contrato).Include(c => c.Cliente)
            .Where(c => (de == null || c.DataAbertura >= de) && (ateExclusivo == null || c.DataAbertura < ateExclusivo)
                        && (status == null || c.Status == status)
                        && (contratoId == null || c.ContratoId == contratoId)
                        && (clienteId == null || c.ClienteId == clienteId))
            .OrderByDescending(c => c.DataAbertura)
            .ToListAsync();

    public async Task<Dictionary<StatusChamado, int>> ContarPorStatusAsync(DateTime de, DateTime ateExclusivo) =>
        await db.Chamados.Where(c => c.DataAbertura >= de && c.DataAbertura < ateExclusivo)
            .GroupBy(c => c.Status).ToDictionaryAsync(g => g.Key, g => g.Count());

    public async Task<List<(int Ano, int Mes, int Total)>> ContarPorMesAsync(DateTime de, DateTime ateExclusivo) =>
        (await db.Chamados.Where(c => c.DataAbertura >= de && c.DataAbertura < ateExclusivo)
            .GroupBy(c => new { c.DataAbertura.Year, c.DataAbertura.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Count() }).ToListAsync())
            .Select(x => (x.Year, x.Month, x.Total)).ToList();

    public async Task<List<(TipoContrato Tipo, int Total)>> ContarPorTipoContratoAsync(DateTime de, DateTime ateExclusivo) =>
        (await db.Chamados.Where(c => c.DataAbertura >= de && c.DataAbertura < ateExclusivo)
            .GroupBy(c => c.Contrato!.Tipo)
            .Select(g => new { Tipo = g.Key, Total = g.Count() }).ToListAsync())
            .Select(x => (x.Tipo, x.Total)).ToList();

    public async Task<List<(string Cliente, int Total)>> ClientesComMaisChamadosAsync(DateTime de, DateTime ateExclusivo, int quantidade) =>
        (await db.Chamados.Where(c => c.DataAbertura >= de && c.DataAbertura < ateExclusivo)
            .GroupBy(c => new { c.ClienteId, c.Cliente!.Nome })
            .Select(g => new { g.Key.Nome, Total = g.Count() })
            .OrderByDescending(x => x.Total).ThenBy(x => x.Nome).Take(quantidade).ToListAsync())
            .Select(x => (x.Nome, x.Total)).ToList();

    public Task<int> ContarSemSolucaoAbertosAntesDeAsync(DateTime limite) =>
        db.Chamados.CountAsync(c => (c.Status == StatusChamado.Aberto || c.Status == StatusChamado.EmAndamento) && c.DataAbertura < limite);
}
