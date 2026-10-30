using Jake.Domain.DTOs;
using Jake.Domain.Enums;
using Jake.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jake.Api.Controllers;

/// <summary>Consulta de usuários (ex.: escolher o cliente de um contrato). Nunca expõe o hash da senha.</summary>
[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = "Gerente")]
public class UsuariosController(IUsuarioService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<UsuarioResponse>>> Listar([FromQuery] PerfilUsuario? perfil) =>
        Ok(await service.ListarAsync(perfil));
}
