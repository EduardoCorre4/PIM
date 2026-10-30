using System.Security.Claims;
using Jake.Domain.Enums;

namespace Jake.Api;

public static class ClaimsExtensions
{
    public static int ObterUsuarioId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public static PerfilUsuario ObterPerfil(this ClaimsPrincipal user) =>
        Enum.Parse<PerfilUsuario>(user.FindFirstValue(ClaimTypes.Role)!);
}
