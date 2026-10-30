using Jake.Domain.Entities;
using Jake.Domain.Enums;

namespace Jake.Repository.Interfaces;

public interface IContratoRepository
{
    Task<List<Contrato>> ListarAsync();
    Task<List<Contrato>> ListarPorClienteAsync(int clienteId);
    Task<Contrato?> ObterPorIdAsync(int id);
    Task<bool> NumeroExisteAsync(string numero, int? ignorarId = null);
    Task AdicionarAsync(Contrato contrato);
    Task AtualizarAsync(Contrato contrato);
    Task RemoverAsync(Contrato contrato);
    Task<bool> PossuiChamadosAsync(int contratoId);
    Task<Dictionary<StatusContrato, int>> ContarPorStatusAsync();
    Task<int> ContarAtivosVencendoAsync(DateTime hoje, int dias);
    Task<int> ContarAtivosVencidosAsync(DateTime hoje);
    Task<List<Contrato>> ListarFiltradoAsync(StatusContrato? status, DateTime? venceAte, DateTime hoje);
}
