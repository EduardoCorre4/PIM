using Jake.Domain.DTOs;
using Jake.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jake.Api.Controllers;

/// <summary>Contratos do cliente autenticado (usado pelo app para escolher onde abrir o chamado).</summary>
[ApiController]
[Route("api/meus-contratos")]
[Authorize(Roles = "Cliente")]
public class MeusContratosController(IContratoService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ContratoResponse>>> Listar() =>
        Ok(await service.ListarDoClienteAsync(User.ObterUsuarioId()));
}
