using System.ComponentModel.DataAnnotations;
using Jake.Domain.Enums;

namespace Jake.Domain.DTOs;

public record LoginRequest([Required, EmailAddress] string Email, [Required] string Senha);

public record RegistrarUsuarioRequest(
    [Required, StringLength(150)] string Nome,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Senha,
    PerfilUsuario Perfil);

public record AuthResponse(string Token, DateTime ExpiraEm, int UsuarioId, string Nome, PerfilUsuario Perfil, string? RefreshToken = null);

public record RefreshRequest([Required] string RefreshToken);

public record UsuarioResponse(int Id, string Nome, string Email, PerfilUsuario Perfil);
