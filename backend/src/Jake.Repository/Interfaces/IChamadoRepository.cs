using Jake.Domain.Entities;
using Jake.Domain.Enums;

namespace Jake.Repository.Interfaces;

public interface IChamadoRepository
{
    /// <summary>Abre o chamado exclusivamente via sp_AbrirChamado (que revalida o contrato). Retorna o Id.</summary>
    Task<int> AbrirAsync(int contratoId, int clienteId, string titulo, string descricao, string? chaveIdempotencia);
    Task<Chamado?> ObterPorChaveAsync(int clienteId, string chaveIdempotencia);
    Task<Chamado?> ObterPorIdAsync(int id);
    Task<List<Chamado>> ListarAsync(StatusChamado? status = null, int? clienteId = null);
    Task AtualizarAsync(Chamado chamado);
    Task<Dictionary<StatusChamado, int>> ContarPorStatusAsync();

    // Relatórios: período = [de, ateExclusivo) sobre DataAbertura (UTC).
    Task<List<Chamado>> ListarFiltradoAsync(DateTime? de, DateTime? ateExclusivo, StatusChamado? status, int? contratoId, int? clienteId);
    Task<Dictionary<StatusChamado, int>> ContarPorStatusAsync(DateTime de, DateTime ateExclusivo);
    Task<List<(int Ano, int Mes, int Total)>> ContarPorMesAsync(DateTime de, DateTime ateExclusivo);
    Task<List<(TipoContrato Tipo, int Total)>> ContarPorTipoContratoAsync(DateTime de, DateTime ateExclusivo);
    Task<List<(string Cliente, int Total)>> ClientesComMaisChamadosAsync(DateTime de, DateTime ateExclusivo, int quantidade);
    /// <summary>Chamados ainda Abertos/Em andamento abertos antes do limite (backlog envelhecido).</summary>
    Task<int> ContarSemSolucaoAbertosAntesDeAsync(DateTime limite);
}
