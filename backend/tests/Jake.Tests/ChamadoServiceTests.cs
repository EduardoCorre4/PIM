using Jake.Domain;
using Jake.Domain.DTOs;
using Jake.Domain.Entities;
using Jake.Domain.Enums;
using Jake.Repository.Interfaces;
using Jake.Service.Implementations;
using NSubstitute;

namespace Jake.Tests;

public class ChamadoServiceTests
{
    private readonly IChamadoRepository _chamados = Substitute.For<IChamadoRepository>();
    private readonly IContratoRepository _contratos = Substitute.For<IContratoRepository>();
    private readonly ChamadoService _sut;

    public ChamadoServiceTests()
    {
        _sut = new ChamadoService(_chamados, _contratos);
        _chamados.AbrirAsync(default, default, default!, default!, default).ReturnsForAnyArgs(10);
        _chamados.ObterPorIdAsync(10).Returns(new Chamado { Id = 10, Titulo = "T", ClienteId = 2, ContratoId = 1 });
    }

    private static AbrirChamadoRequest Req(string? chave = null) => new(1, " Impressora ", "desc", chave);

    [Fact]
    public async Task Contrato_ativo_e_vigente_abre_chamado_via_procedure()
    {
        _contratos.ObterPorIdAsync(1).Returns(Fabrica.Contrato());
        var r = await _sut.AbrirAsync(2, Req());
        Assert.Equal(10, r.Id);
        await _chamados.Received(1).AbrirAsync(1, 2, "Impressora", "desc", null); // título sem espaços nas pontas
    }

    [Theory]
    [InlineData(StatusContrato.Inativo, -30, 30)]
    [InlineData(StatusContrato.Encerrado, -30, 30)]
    [InlineData(StatusContrato.Ativo, -60, -1)]  // vencido ontem
    [InlineData(StatusContrato.Ativo, 1, 60)]    // ainda não começou
    public async Task Contrato_invalido_e_recusado_sem_chamar_o_banco(StatusContrato st, int ini, int fim)
    {
        _contratos.ObterPorIdAsync(1).Returns(Fabrica.Contrato(status: st, inicioEmDias: ini, fimEmDias: fim));
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.AbrirAsync(2, Req()));
        await _chamados.DidNotReceiveWithAnyArgs().AbrirAsync(default, default, default!, default!, default);
    }

    [Fact]
    public async Task Ultimo_dia_de_vigencia_ainda_vale()
    {
        _contratos.ObterPorIdAsync(1).Returns(Fabrica.Contrato(fimEmDias: 0));
        await _sut.AbrirAsync(2, Req());
        await _chamados.ReceivedWithAnyArgs(1).AbrirAsync(default, default, default!, default!, default);
    }

    [Fact]
    public async Task Contrato_de_outro_cliente_e_recusado()
    {
        _contratos.ObterPorIdAsync(1).Returns(Fabrica.Contrato(clienteId: 99));
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.AbrirAsync(2, Req()));
    }

    [Fact]
    public async Task Contrato_inexistente_gera_nao_encontrado()
    {
        _contratos.ObterPorIdAsync(1).Returns((Contrato?)null);
        await Assert.ThrowsAsync<NaoEncontradoException>(() => _sut.AbrirAsync(2, Req()));
    }

    [Fact]
    public async Task Reenvio_com_mesma_chave_devolve_o_existente_sem_validar_nem_criar()
    {
        _chamados.ObterPorChaveAsync(2, "k1").Returns(new Chamado { Id = 77, Titulo = "já criado", ClienteId = 2 });
        var r = await _sut.AbrirAsync(2, Req("k1"));
        Assert.Equal(77, r.Id);
        await _contratos.DidNotReceiveWithAnyArgs().ObterPorIdAsync(default);
        await _chamados.DidNotReceiveWithAnyArgs().AbrirAsync(default, default, default!, default!, default);
    }

    [Fact]
    public async Task Cliente_nao_ve_chamado_de_outro()
    {
        _chamados.ObterPorIdAsync(5).Returns(new Chamado { Id = 5, ClienteId = 99 });
        await Assert.ThrowsAsync<NaoEncontradoException>(() => _sut.ObterAsync(5, 2, PerfilUsuario.Cliente));
        var r = await _sut.ObterAsync(5, 1, PerfilUsuario.Gerente); // gerente enxerga
        Assert.Equal(5, r.Id);
    }

    [Fact]
    public async Task Chamado_fechado_nao_muda_de_situacao()
    {
        _chamados.ObterPorIdAsync(6).Returns(new Chamado { Id = 6, Status = StatusChamado.Fechado });
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.AtualizarStatusAsync(6, StatusChamado.Aberto));
    }
}
