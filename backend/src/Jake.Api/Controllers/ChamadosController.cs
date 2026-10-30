using Jake.Domain.DTOs;
using Jake.Domain.Enums;
using Jake.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jake.Api.Controllers;

[ApiController]
[Route("api/chamados")]
[Authorize]
public class ChamadosController(IChamadoService service) : ControllerBase
{
    /// <summary>Cliente abre chamado; o ClienteId vem do token (nunca do corpo da requisição).</summary>
    [HttpPost]
    [Authorize(Roles = "Cliente")]
    public async Task<ActionResult<ChamadoResponse>> Abrir(AbrirChamadoRequest request)
    {
        var criado = await service.AbrirAsync(User.ObterUsuarioId(), request);
        return CreatedAtAction(nameof(Obter), new { id = criado.Id }, criado);
    }

    /// <summary>Acompanhamento: chamados do cliente autenticado, com filtro opcional por status.</summary>
    [HttpGet("meus")]
    [Authorize(Roles = "Cliente")]
    public async Task<ActionResult<List<ChamadoResponse>>> Meus([FromQuery] StatusChamado? status) =>
        Ok(await service.ListarDoClienteAsync(User.ObterUsuarioId(), status));

    /// <summary>Fila de atendimento: todos os chamados, com filtro opcional por status.</summary>
    [HttpGet]
    [Authorize(Roles = "Gerente,Funcionario")]
    public async Task<ActionResult<List<ChamadoResponse>>> Fila([FromQuery] StatusChamado? status) =>
        Ok(await service.ListarTodosAsync(status));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ChamadoResponse>> Obter(int id) =>
        Ok(await service.ObterAsync(id, User.ObterUsuarioId(), User.ObterPerfil()));

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Gerente,Funcionario")]
    public async Task<ActionResult<ChamadoResponse>> AtualizarStatus(int id, AtualizarStatusChamadoRequest request) =>
        Ok(await service.AtualizarStatusAsync(id, request.Status));
}
