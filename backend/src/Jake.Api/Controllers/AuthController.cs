using System.Security.Claims;
using Jake.Domain.DTOs;
using Jake.Domain.Enums;
using Jake.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Jake.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request) =>
        Ok(await auth.LoginAsync(request, HttpContext.Connection.RemoteIpAddress?.ToString()));

    /// <summary>
    /// Auto-cadastro público cria sempre um Cliente. Criar Funcionários/Gerentes exige um Gerente autenticado,
    /// impedindo escalonamento de privilégio.
    /// </summary>
    [HttpPost("registrar")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Registrar(RegistrarUsuarioRequest request)
    {
        if (request.Perfil != PerfilUsuario.Cliente &&
            !(User.Identity?.IsAuthenticated == true && User.IsInRole(nameof(PerfilUsuario.Gerente))))
            return Forbid();

        return Ok(await auth.RegistrarAsync(request));
    }

    /// <summary>Renova a sessão: troca o refresh token por um novo token de acesso + novo refresh token.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request) =>
        Ok(await auth.RenovarAsync(request.RefreshToken));

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout(RefreshRequest request)
    {
        await auth.SairAsync(request.RefreshToken);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me() => Ok(new
    {
        Id = User.FindFirstValue(ClaimTypes.NameIdentifier),
        Nome = User.Identity?.Name,
        Perfil = User.FindFirstValue(ClaimTypes.Role)
    });
}
