using Jake.Domain.DTOs;
using Jake.Domain.Enums;
using Jake.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jake.Api.Controllers;

/// <summary>Painel do Gerente: listagem global de chamados, indicadores e edição de contratos.</summary>
[ApiController]
[Route("api/painel")]
[Authorize(Roles = "Gerente")]
public class PainelController(IChamadoService chamados, IPainelService painel) : ControllerBase
{
    [HttpGet("chamados")]
    public async Task<ActionResult<List<ChamadoResponse>>> Chamados([FromQuery] StatusChamado? status) =>
        Ok(await chamados.ListarTodosAsync(status));

    [HttpGet("indicadores")]
    public async Task<ActionResult<IndicadoresResponse>> Indicadores() => Ok(await painel.ObterIndicadoresAsync());

    [HttpPatch("contratos/{id:int}/status")]
    public async Task<ActionResult<ContratoResponse>> AlterarStatusContrato(int id, AtualizarStatusContratoRequest request) =>
        Ok(await painel.AlterarStatusContratoAsync(id, request.Status));
}
