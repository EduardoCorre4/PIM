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

    /// <summary>Detalhe do chamado com o histórico de mensagens (mais antiga primeiro).</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ChamadoDetalheResponse>> Obter(int id) =>
        Ok(await service.ObterDetalheAsync(id, User.ObterUsuarioId(), User.ObterPerfil()));

    /// <summary>Nova mensagem: cliente dono, funcionário ou gerente. Bloqueada se o chamado estiver Fechado.</summary>
    [HttpPost("{id:int}/mensagens")]
    public async Task<ActionResult<MensagemChamadoResponse>> EnviarMensagem(int id, EnviarMensagemRequest request) =>
        Ok(await service.EnviarMensagemAsync(id, User.ObterUsuarioId(), User.ObterPerfil(), request.Conteudo));

    /// <summary>Equipe altera a situação; cliente dono (ou gerente) reabre chamado Fechado.</summary>
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<ChamadoResponse>> AtualizarStatus(int id, AtualizarStatusChamadoRequest request) =>
        Ok(await service.AtualizarStatusAsync(id, request.Status, User.ObterUsuarioId(), User.ObterPerfil()));
}
