using Jake.Domain.DTOs;

namespace Jake.Service.Interfaces;

public interface IRelatorioService
{
    Task<RelatorioResumoResponse> ResumoAsync(DateOnly? de, DateOnly? ate);
    Task<List<ChamadoResponse>> ChamadosAsync(FiltroChamados filtro);
    Task<List<ContratoResponse>> ContratosAsync(FiltroContratos filtro);
    Task<byte[]> ChamadosCsvAsync(FiltroChamados filtro);
    Task<byte[]> ContratosCsvAsync(FiltroContratos filtro);
}
