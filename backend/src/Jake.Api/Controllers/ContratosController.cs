using Jake.Domain.DTOs;
using Jake.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jake.Api.Controllers;

/// <summary>CRUD de contratos — restrito ao Gerente (Painel do Gerente).</summary>
[ApiController]
[Route("api/contratos")]
[Authorize(Roles = "Gerente")]
public class ContratosController(IContratoService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ContratoResponse>>> Listar() => Ok(await service.ListarAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ContratoResponse>> Obter(int id) => Ok(await service.ObterAsync(id));

    [HttpPost]
    public async Task<ActionResult<ContratoResponse>> Criar(ContratoRequest request)
    {
        var criado = await service.CriarAsync(request);
        return CreatedAtAction(nameof(Obter), new { id = criado.Id }, criado);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ContratoResponse>> Atualizar(int id, ContratoRequest request) =>
        Ok(await service.AtualizarAsync(id, request));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Remover(int id)
    {
        await service.RemoverAsync(id);
        return NoContent();
    }
}
