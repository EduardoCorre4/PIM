using Jake.Domain.DTOs;

namespace Jake.Service.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ip);
    Task<AuthResponse> RegistrarAsync(RegistrarUsuarioRequest request);
    Task<AuthResponse> RenovarAsync(string refreshToken);
    Task SairAsync(string refreshToken);
}
