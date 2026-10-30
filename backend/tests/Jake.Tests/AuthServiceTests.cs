using Jake.Domain;
using Jake.Domain.DTOs;
using Jake.Domain.Entities;
using Jake.Domain.Enums;
using Jake.Repository.Interfaces;
using Jake.Service;
using Jake.Service.Implementations;
using Microsoft.Extensions.Options;
using NSubstitute;

namespace Jake.Tests;

public class AuthServiceTests
{
    private readonly IUsuarioRepository _usuarios = Substitute.For<IUsuarioRepository>();
    private readonly ILogAcessoRepository _logs = Substitute.For<ILogAcessoRepository>();
    private readonly IRefreshTokenRepository _tokens = Substitute.For<IRefreshTokenRepository>();
    private readonly AuthService _sut;
    private readonly List<RefreshToken> _emitidos = [];

    public AuthServiceTests()
    {
        _sut = new AuthService(_usuarios, _logs, _tokens,
            Options.Create(new JwtSettings { Key = new string('k', 40), RefreshExpiracaoDias = 30 }));
        _tokens.When(t => t.AdicionarAsync(Arg.Any<RefreshToken>())).Do(ci => _emitidos.Add(ci.Arg<RefreshToken>()));
        _tokens.ObterPorHashAsync(Arg.Any<string>()).Returns(ci => _emitidos.FirstOrDefault(t => t.TokenHash == ci.Arg<string>()));
    }

    private static Usuario Usuario(string senha = "senha-forte-1") =>
        new() { Id = 2, Nome = "Ana", Email = "ana@x.com", Perfil = PerfilUsuario.Cliente, Ativo = true, SenhaHash = PasswordHasher.Hash(senha) };

    [Fact]
    public async Task Login_correto_devolve_jwt_e_refresh_e_registra_log()
    {
        _usuarios.ObterPorEmailAsync("ana@x.com").Returns(Usuario());
        var r = await _sut.LoginAsync(new LoginRequest("ANA@x.com ", "senha-forte-1"), "1.2.3.4");
        Assert.Equal(3, r.Token.Split('.').Length);
        Assert.False(string.IsNullOrEmpty(r.RefreshToken));
        await _logs.Received(1).AdicionarAsync(Arg.Is<LogAcesso>(l => l.Sucesso && l.IpOrigem == "1.2.3.4"));
    }

    [Fact]
    public async Task Refresh_token_e_guardado_apenas_como_hash()
    {
        _usuarios.ObterPorEmailAsync("ana@x.com").Returns(Usuario());
        var r = await _sut.LoginAsync(new LoginRequest("ana@x.com", "senha-forte-1"), null);
        Assert.DoesNotContain(_emitidos, t => t.TokenHash == r.RefreshToken);
        Assert.Equal(64, _emitidos[0].TokenHash.Length); // SHA-256 em hexadecimal
    }

    [Theory]
    [InlineData("errada")]
    [InlineData("")]
    public async Task Senha_errada_e_recusada_e_registrada(string senha)
    {
        _usuarios.ObterPorEmailAsync("ana@x.com").Returns(Usuario());
        await Assert.ThrowsAsync<NaoAutorizadoException>(() => _sut.LoginAsync(new LoginRequest("ana@x.com", senha), null));
        await _logs.Received(1).AdicionarAsync(Arg.Is<LogAcesso>(l => !l.Sucesso));
    }

    [Fact]
    public async Task Usuario_inexistente_recebe_a_mesma_mensagem_da_senha_errada()
    {
        _usuarios.ObterPorEmailAsync(default!).ReturnsForAnyArgs((Usuario?)null);
        var e = await Assert.ThrowsAsync<NaoAutorizadoException>(() => _sut.LoginAsync(new LoginRequest("x@x.com", "qualquer"), null));
        Assert.Equal("Credenciais inválidas.", e.Message);
    }

    [Fact]
    public async Task Refresh_troca_o_par_e_revoga_o_antigo()
    {
        var u = Usuario();
        _usuarios.ObterPorEmailAsync("ana@x.com").Returns(u);
        _usuarios.ObterPorIdAsync(2).Returns(u);
        var login = await _sut.LoginAsync(new LoginRequest("ana@x.com", "senha-forte-1"), null);

        var novo = await _sut.RenovarAsync(login.RefreshToken!);

        Assert.NotEqual(login.RefreshToken, novo.RefreshToken);
        Assert.NotNull(_emitidos[0].RevogadoEm);
        Assert.Null(_emitidos[1].RevogadoEm);
    }

    [Fact]
    public async Task Reuso_de_refresh_token_revoga_todas_as_sessoes()
    {
        var u = Usuario();
        _usuarios.ObterPorEmailAsync("ana@x.com").Returns(u);
        _usuarios.ObterPorIdAsync(2).Returns(u);
        var login = await _sut.LoginAsync(new LoginRequest("ana@x.com", "senha-forte-1"), null);
        await _sut.RenovarAsync(login.RefreshToken!);

        await Assert.ThrowsAsync<NaoAutorizadoException>(() => _sut.RenovarAsync(login.RefreshToken!)); // já usado
        await _tokens.Received(1).RevogarTodosDoUsuarioAsync(2);
    }

    [Fact]
    public async Task Refresh_expirado_ou_desconhecido_e_recusado()
    {
        var u = Usuario();
        _usuarios.ObterPorEmailAsync("ana@x.com").Returns(u);
        var login = await _sut.LoginAsync(new LoginRequest("ana@x.com", "senha-forte-1"), null);
        _emitidos[0].ExpiraEm = DateTime.UtcNow.AddMinutes(-1);

        await Assert.ThrowsAsync<NaoAutorizadoException>(() => _sut.RenovarAsync(login.RefreshToken!));
        await Assert.ThrowsAsync<NaoAutorizadoException>(() => _sut.RenovarAsync("token-que-nao-existe"));
    }

    [Fact]
    public async Task Refresh_de_usuario_desativado_e_recusado()
    {
        var u = Usuario();
        _usuarios.ObterPorEmailAsync("ana@x.com").Returns(u);
        _usuarios.ObterPorIdAsync(2).Returns(new Usuario { Id = 2, Ativo = false });
        var login = await _sut.LoginAsync(new LoginRequest("ana@x.com", "senha-forte-1"), null);
        await Assert.ThrowsAsync<NaoAutorizadoException>(() => _sut.RenovarAsync(login.RefreshToken!));
    }

    [Fact]
    public async Task Logout_revoga_o_token_e_e_idempotente()
    {
        _usuarios.ObterPorEmailAsync("ana@x.com").Returns(Usuario());
        var login = await _sut.LoginAsync(new LoginRequest("ana@x.com", "senha-forte-1"), null);
        await _sut.SairAsync(login.RefreshToken!);
        await _sut.SairAsync(login.RefreshToken!);
        await _sut.SairAsync("desconhecido");
        Assert.NotNull(_emitidos[0].RevogadoEm);
    }

    [Fact]
    public async Task Email_repetido_no_cadastro_e_recusado()
    {
        _usuarios.EmailExisteAsync("ana@x.com").Returns(true);
        await Assert.ThrowsAsync<RegraNegocioException>(() =>
            _sut.RegistrarAsync(new RegistrarUsuarioRequest("Ana", "ana@x.com", "12345678", PerfilUsuario.Cliente)));
    }

    [Fact]
    public void Hash_de_senha_usa_salt_e_verifica()
    {
        var a = PasswordHasher.Hash("abc12345");
        var b = PasswordHasher.Hash("abc12345");
        Assert.NotEqual(a, b);
        Assert.True(PasswordHasher.Verificar("abc12345", a));
        Assert.False(PasswordHasher.Verificar("abc12346", a));
        Assert.False(PasswordHasher.Verificar("x", "formato-invalido"));
    }
}
