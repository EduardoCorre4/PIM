using Jake.Domain.Enums;

namespace Jake.Domain.DTOs;

public record ItemContagem(string Rotulo, int Total);

/// <summary>Filtros do relatório de chamados. Datas são dias inteiros (UTC), com os dois extremos incluídos.</summary>
public record FiltroChamados(DateOnly? De, DateOnly? Ate, StatusChamado? Status, int? ContratoId, int? ClienteId);

public record FiltroContratos(StatusContrato? Status, int? VenceEmDias);

public record RelatorioResumoResponse(
    DateOnly De,
    DateOnly Ate,
    int TotalChamados,
    List<ItemContagem> ChamadosPorSituacao,
    List<ItemContagem> ChamadosPorMes,
    List<ItemContagem> ChamadosPorTipoContrato,
    List<ItemContagem> ClientesComMaisChamados,
    int ChamadosSemSolucaoHaMaisDe7Dias,
    int ContratosAtivosVencendoEm30Dias,
    int ContratosAtivosVencendoEm60Dias,
    int ContratosAtivosVencendoEm90Dias,
    int ContratosAtivosJaVencidos);
