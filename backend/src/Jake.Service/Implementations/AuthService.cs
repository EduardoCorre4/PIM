using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Jake.Domain;
using Jake.Domain.DTOs;
using Jake.Domain.Entities;
using Jake.Domain.Enums;
using Jake.Repository.Interfaces;
using Jake.Service.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Jake.Service.Implementations;

public class AuthService(
    IUsuarioRepository usuarios,
    ILogAcessoRepository logs,
    IRefreshTokenRepository refreshTokens,
    IOptions<JwtSettings> jwtOptions) : IAuthService
{
    private readonly JwtSettings _jwt = jwtOptions.Value;

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ip)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var usuario = await usuarios.ObterPorEmailAsync(email);

        // Mesma mensagem para e-mail inexistente e senha errada, evitando enumeração de usuários.
        var valido = usuario is { Ativo: true } && PasswordHasher.Verificar(request.Senha, usuario.SenhaHash);

        await logs.AdicionarAsync(new LogAcesso
        {
            UsuarioId = usuario?.Id,
            Acao = valido ? "LOGIN" : $"LOGIN_FALHA:{email}",
            Sucesso = valido,
            IpOrigem = ip
        });

        if (!valido) throw new NaoAutorizadoException("Credenciais inválidas.");
        return await EmitirAsync(usuario!);
    }

    public async Task<AuthResponse> RegistrarAsync(RegistrarUsuarioRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await usuarios.EmailExisteAsync(email))
            throw new RegraNegocioException("E-mail já cadastrado.");

        var usuario = new Usuario
        {
            Nome = request.Nome.Trim(),
            Email = email,
            SenhaHash = PasswordHasher.Hash(request.Senha),
            Perfil = request.Perfil
        };
        await usuarios.AdicionarAsync(usuario);
        return await EmitirAsync(usuario);
    }

    /// <summary>
    /// Troca o refresh token por um novo par (rotação). Um token já usado e reapresentado indica possível
    /// roubo: todas as sessões do usuário são revogadas.
    /// </summary>
    public async Task<AuthResponse> RenovarAsync(string refreshToken)
    {
        var rt = await refreshTokens.ObterPorHashAsync(HashToken(refreshToken))
            ?? throw new NaoAutorizadoException("Sessão inválida.");

        if (rt.RevogadoEm is not null)
        {
            await refreshTokens.RevogarTodosDoUsuarioAsync(rt.UsuarioId);
            throw new NaoAutorizadoException("Sessão inválida.");
        }
        if (rt.ExpiraEm <= DateTime.UtcNow) throw new NaoAutorizadoException("Sessão expirada.");

        var usuario = await usuarios.ObterPorIdAsync(rt.UsuarioId);
        if (usuario is not { Ativo: true }) throw new NaoAutorizadoException("Sessão inválida.");

        rt.RevogadoEm = DateTime.UtcNow;
        await refreshTokens.SalvarAsync(rt);
        return await EmitirAsync(usuario);
    }

    public async Task SairAsync(string refreshToken)
    {
        var rt = await refreshTokens.ObterPorHashAsync(HashToken(refreshToken));
        if (rt is null || rt.RevogadoEm is not null) return;
        rt.RevogadoEm = DateTime.UtcNow;
        await refreshTokens.SalvarAsync(rt);
    }

    private async Task<AuthResponse> EmitirAsync(Usuario u)
    {
        var bruto = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');
        await refreshTokens.AdicionarAsync(new RefreshToken
        {
            UsuarioId = u.Id,
            TokenHash = HashToken(bruto),
            ExpiraEm = DateTime.UtcNow.AddDays(_jwt.RefreshExpiracaoDias)
        });
        return GerarToken(u) with { RefreshToken = bruto };
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    /// <summary>O token carrega Id, nome, e-mail e Perfil (claim de role) para autorização por perfil.</summary>
    private AuthResponse GerarToken(Usuario u)
    {
        var expira = DateTime.UtcNow.AddMinutes(_jwt.ExpiracaoMinutos);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, u.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, u.Email),
            new Claim(ClaimTypes.NameIdentifier, u.Id.ToString()),
            new Claim(ClaimTypes.Name, u.Nome),
            new Claim(ClaimTypes.Role, u.Perfil.ToString())
        };
        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(_jwt.Issuer, _jwt.Audience, claims, expires: expira, signingCredentials: creds);
        return new AuthResponse(new JwtSecurityTokenHandler().WriteToken(token), expira, u.Id, u.Nome, u.Perfil);
    }
}
