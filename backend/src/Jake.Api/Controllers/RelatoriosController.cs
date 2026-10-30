using Jake.Domain.DTOs;
using Jake.Domain.Enums;
using Jake.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jake.Api.Controllers;

/// <summary>Relatórios gerenciais (somente Gerente). Com <c>formato=csv</c> devolve um arquivo para o Excel.</summary>
[ApiController]
[Route("api/relatorios")]
[Authorize(Roles = "Gerente")]
public class RelatoriosController(IRelatorioService service) : ControllerBase
{
    [HttpGet("resumo")]
    public async Task<ActionResult<RelatorioResumoResponse>> Resumo([FromQuery] DateOnly? de, [FromQuery] DateOnly? ate) =>
        Ok(await service.ResumoAsync(de, ate));

    [HttpGet("chamados")]
    public async Task<IActionResult> Chamados(
        [FromQuery] DateOnly? de, [FromQuery] DateOnly? ate, [FromQuery] StatusChamado? status,
        [FromQuery] int? contratoId, [FromQuery] int? clienteId, [FromQuery] string? formato)
    {
        var filtro = new FiltroChamados(de, ate, status, contratoId, clienteId);
        return Csv(formato) ? Arquivo(await service.ChamadosCsvAsync(filtro), "chamados")
                            : Ok(await service.ChamadosAsync(filtro));
    }

    [HttpGet("contratos")]
    public async Task<IActionResult> Contratos(
        [FromQuery] StatusContrato? status, [FromQuery] int? venceEmDias, [FromQuery] string? formato)
    {
        var filtro = new FiltroContratos(status, venceEmDias);
        return Csv(formato) ? Arquivo(await service.ContratosCsvAsync(filtro), "contratos")
                            : Ok(await service.ContratosAsync(filtro));
    }

    private static bool Csv(string? f) => string.Equals(f, "csv", StringComparison.OrdinalIgnoreCase);

    private FileContentResult Arquivo(byte[] bytes, string nome) =>
        File(bytes, "text/csv; charset=utf-8", $"{nome}-{DateTime.UtcNow:yyyy-MM-dd}.csv");
}
