using Jake.Domain;
using Jake.Domain.DTOs;
using Jake.Domain.Entities;
using Jake.Domain.Enums;
using Jake.Repository.Interfaces;
using Jake.Service.Implementations;
using NSubstitute;

namespace Jake.Tests;

public class ContratoServiceTests
{
    private readonly IContratoRepository _contratos = Substitute.For<IContratoRepository>();
    private readonly IUsuarioRepository _usuarios = Substitute.For<IUsuarioRepository>();
    private readonly ContratoService _sut;

    public ContratoServiceTests()
    {
        _sut = new ContratoService(_contratos, _usuarios);
        _usuarios.ObterPorIdAsync(2).Returns(Fabrica.Cliente());
        _contratos.NumeroExisteAsync(default!, default).ReturnsForAnyArgs(false);
        _contratos.ObterPorIdAsync(Arg.Any<int>()).Returns(ci => Fabrica.Contrato(ci.Arg<int>()));
    }

    private static ContratoRequest Req(DateTime? ini = null, DateTime? fim = null, int cliente = 2) =>
        new("C-1", "d", TipoContrato.SP, StatusContrato.Ativo, ini ?? new(2026, 1, 1), fim ?? new(2026, 12, 31), cliente);

    [Fact]
    public async Task Cria_contrato_valido()
    {
        await _sut.CriarAsync(Req());
        await _contratos.Received(1).AdicionarAsync(Arg.Is<Contrato>(c => c.Numero == "C-1" && c.ClienteId == 2));
    }

    [Fact]
    public async Task Data_fim_antes_do_inicio_e_recusada()
    {
        var e = await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.CriarAsync(Req(new(2026, 5, 1), new(2026, 4, 1))));
        Assert.Contains("data de fim", e.Message);
    }

    [Fact]
    public async Task Numero_duplicado_e_recusado()
    {
        _contratos.NumeroExisteAsync("C-1", null).Returns(true);
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.CriarAsync(Req()));
    }

    [Theory]
    [InlineData(PerfilUsuario.Funcionario)]
    [InlineData(PerfilUsuario.Gerente)]
    public async Task Dono_do_contrato_precisa_ser_cliente(PerfilUsuario perfil)
    {
        _usuarios.ObterPorIdAsync(3).Returns(new Usuario { Id = 3, Perfil = perfil, Ativo = true });
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.CriarAsync(Req(cliente: 3)));
    }

    [Fact]
    public async Task Cliente_inativo_ou_inexistente_e_recusado()
    {
        _usuarios.ObterPorIdAsync(4).Returns(new Usuario { Id = 4, Perfil = PerfilUsuario.Cliente, Ativo = false });
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.CriarAsync(Req(cliente: 4)));
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.CriarAsync(Req(cliente: 404)));
    }

    [Fact]
    public async Task Contrato_com_chamados_nao_pode_ser_excluido()
    {
        _contratos.PossuiChamadosAsync(1).Returns(true);
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.RemoverAsync(1));
        await _contratos.DidNotReceiveWithAnyArgs().RemoverAsync(default!);
    }

    [Fact]
    public async Task Contrato_sem_chamados_e_excluido()
    {
        await _sut.RemoverAsync(1);
        await _contratos.ReceivedWithAnyArgs(1).RemoverAsync(default!);
    }
}
