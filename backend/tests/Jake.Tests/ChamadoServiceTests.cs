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
    private readonly IMensagemChamadoRepository _msgs = Substitute.For<IMensagemChamadoRepository>();
    private readonly IUsuarioRepository _usuarios = Substitute.For<IUsuarioRepository>();
    private readonly ChamadoService _sut;

    public ChamadoServiceTests()
    {
        _sut = new ChamadoService(_chamados, _contratos, _msgs, _usuarios);
        _usuarios.ObterPorIdAsync(Arg.Any<int>()).Returns(ci => new Usuario { Id = ci.Arg<int>(), Nome = "Fulano", Perfil = PerfilUsuario.Cliente });
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
    public async Task Descricao_inicial_vira_primeira_mensagem()
    {
        _contratos.ObterPorIdAsync(1).Returns(Fabrica.Contrato());
        _chamados.ObterPorIdAsync(10).Returns(new Chamado { Id = 10, ClienteId = 2, Descricao = "desc" });
        await _sut.AbrirAsync(2, Req());
        await _msgs.Received(1).AdicionarAsync(Arg.Is<MensagemChamado>(m =>
            m.ChamadoId == 10 && m.AutorId == 2 && m.AutorPerfil == PerfilUsuario.Cliente && m.Conteudo == "desc"));
    }

    private void Chamado(StatusChamado st, int cliente = 2) =>
        _chamados.ObterPorIdAsync(6).Returns(new Chamado { Id = 6, Status = st, ClienteId = cliente });

    [Fact]
    public async Task Detalhe_traz_mensagens_na_ordem_do_repositorio()
    {
        Chamado(StatusChamado.Aberto);
        _msgs.ListarAsync(6).Returns([new MensagemChamado { Id = 1, Conteudo = "a" }, new MensagemChamado { Id = 2, Conteudo = "b" }]);
        var d = await _sut.ObterDetalheAsync(6, 2, PerfilUsuario.Cliente);
        Assert.Equal(["a", "b"], d.Mensagens.Select(m => m.Conteudo));
    }

    [Fact]
    public async Task Detalhe_de_chamado_antigo_sem_historico_usa_a_descricao()
    {
        _chamados.ObterPorIdAsync(6).Returns(new Chamado { Id = 6, ClienteId = 2, Descricao = "velho" });
        _msgs.ListarAsync(6).Returns([]);
        var d = await _sut.ObterDetalheAsync(6, 2, PerfilUsuario.Cliente);
        Assert.Equal("velho", Assert.Single(d.Mensagens).Conteudo);
    }

    [Fact]
    public async Task Cliente_de_outro_nao_envia_mensagem()
    {
        Chamado(StatusChamado.Aberto);
        await Assert.ThrowsAsync<NaoEncontradoException>(() => _sut.EnviarMensagemAsync(6, 99, PerfilUsuario.Cliente, "oi"));
        await _msgs.DidNotReceiveWithAnyArgs().AdicionarAsync(default!);
    }

    [Fact]
    public async Task Chamado_fechado_bloqueia_mensagem()
    {
        Chamado(StatusChamado.Fechado);
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.EnviarMensagemAsync(6, 2, PerfilUsuario.Cliente, "oi"));
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.EnviarMensagemAsync(6, 5, PerfilUsuario.Funcionario, "oi"));
    }

    [Fact]
    public async Task Mensagem_vazia_e_recusada()
    {
        Chamado(StatusChamado.Aberto);
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.EnviarMensagemAsync(6, 2, PerfilUsuario.Cliente, "   "));
    }

    [Fact]
    public async Task Resposta_do_funcionario_move_aberto_para_em_atendimento()
    {
        Chamado(StatusChamado.Aberto);
        var m = await _sut.EnviarMensagemAsync(6, 5, PerfilUsuario.Funcionario, " olá ");
        Assert.Equal("olá", m.Conteudo);
        Assert.Equal(PerfilUsuario.Funcionario, m.AutorPerfil);
        await _chamados.Received(1).AtualizarAsync(Arg.Is<Chamado>(c => c.Status == StatusChamado.EmAndamento));
    }

    [Fact]
    public async Task Mensagem_do_cliente_nao_muda_a_situacao()
    {
        Chamado(StatusChamado.Aberto);
        await _sut.EnviarMensagemAsync(6, 2, PerfilUsuario.Cliente, "oi");
        await _chamados.DidNotReceiveWithAnyArgs().AtualizarAsync(default!);
    }

    [Theory]
    [InlineData(PerfilUsuario.Funcionario, StatusChamado.Resolvido)]
    [InlineData(PerfilUsuario.Funcionario, StatusChamado.Fechado)]
    [InlineData(PerfilUsuario.Gerente, StatusChamado.Fechado)]
    public async Task Equipe_altera_e_fecha(PerfilUsuario perfil, StatusChamado novo)
    {
        Chamado(StatusChamado.EmAndamento);
        var r = await _sut.AtualizarStatusAsync(6, novo, 5, perfil);
        Assert.Equal(novo, r.Status);
    }

    [Fact]
    public async Task Cliente_nao_fecha_nem_altera_chamado_aberto()
    {
        Chamado(StatusChamado.Aberto);
        await Assert.ThrowsAsync<AcessoNegadoException>(() => _sut.AtualizarStatusAsync(6, StatusChamado.Fechado, 2, PerfilUsuario.Cliente));
    }

    [Theory]
    [InlineData(PerfilUsuario.Cliente, 2)]
    [InlineData(PerfilUsuario.Gerente, 1)]
    public async Task Cliente_dono_e_gerente_reabrem_chamado_fechado(PerfilUsuario perfil, int usuario)
    {
        Chamado(StatusChamado.Fechado);
        var r = await _sut.AtualizarStatusAsync(6, StatusChamado.Aberto, usuario, perfil);
        Assert.Equal(StatusChamado.Aberto, r.Status);
    }

    [Fact]
    public async Task Funcionario_nao_reabre_chamado_fechado()
    {
        Chamado(StatusChamado.Fechado);
        await Assert.ThrowsAsync<AcessoNegadoException>(() => _sut.AtualizarStatusAsync(6, StatusChamado.Aberto, 5, PerfilUsuario.Funcionario));
    }

    [Fact]
    public async Task Cliente_de_outro_nao_reabre()
    {
        Chamado(StatusChamado.Fechado);
        await Assert.ThrowsAsync<NaoEncontradoException>(() => _sut.AtualizarStatusAsync(6, StatusChamado.Aberto, 99, PerfilUsuario.Cliente));
    }

    [Fact]
    public async Task Chamado_fechado_so_pode_voltar_para_aberto()
    {
        Chamado(StatusChamado.Fechado);
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.AtualizarStatusAsync(6, StatusChamado.Resolvido, 1, PerfilUsuario.Gerente));
    }
}
