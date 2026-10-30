using System.Text;
using Jake.Domain;
using Jake.Domain.DTOs;
using Jake.Domain.Entities;
using Jake.Domain.Enums;
using Jake.Repository.Interfaces;
using Jake.Service.Implementations;
using Jake.Service.Relatorios;
using NSubstitute;

namespace Jake.Tests;

public class CsvBuilderTests
{
    [Fact]
    public void Comeca_com_BOM_utf8_e_usa_ponto_e_virgula_e_CRLF()
    {
        var b = CsvBuilder.Gerar(["A", "B"], [["1", "2"]]);
        Assert.Equal([0xEF, 0xBB, 0xBF], b[..3]);
        Assert.Equal("A;B\r\n1;2\r\n", Encoding.UTF8.GetString(b, 3, b.Length - 3));
    }

    [Theory]
    [InlineData("=SOMA(A1:A9)", "'=SOMA(A1:A9)")]
    [InlineData("+cmd", "'+cmd")]
    [InlineData("-1+1", "'-1+1")]
    [InlineData("@x", "'@x")]
    public void Neutraliza_injecao_de_formula(string entrada, string esperado) => Assert.Equal(esperado, CsvBuilder.Celula(entrada));

    [Fact]
    public void Escapa_separador_aspas_e_quebra_de_linha()
    {
        Assert.Equal("\"a;b\"", CsvBuilder.Celula("a;b"));
        Assert.Equal("\"diz \"\"oi\"\"\"", CsvBuilder.Celula("diz \"oi\""));
        Assert.Equal("\"l1\nl2\"", CsvBuilder.Celula("l1\nl2"));
        Assert.Equal("", CsvBuilder.Celula(null));
    }
}

public class RelatorioServiceTests
{
    private readonly IChamadoRepository _chamados = Substitute.For<IChamadoRepository>();
    private readonly IContratoRepository _contratos = Substitute.For<IContratoRepository>();
    private readonly RelatorioService _sut;

    public RelatorioServiceTests()
    {
        _sut = new RelatorioService(_chamados, _contratos);
        _chamados.ContarPorStatusAsync(default, default).ReturnsForAnyArgs(new Dictionary<StatusChamado, int> { [StatusChamado.Aberto] = 3, [StatusChamado.Fechado] = 1 });
        _chamados.ContarPorMesAsync(default, default).ReturnsForAnyArgs([(2026, 1, 2), (2026, 3, 2)]);
        _chamados.ContarPorTipoContratoAsync(default, default).ReturnsForAnyArgs([(TipoContrato.SP, 4)]);
        _chamados.ClientesComMaisChamadosAsync(default, default, default).ReturnsForAnyArgs([("Ana", 4)]);
        _contratos.ContarAtivosVencendoAsync(default, 30).ReturnsForAnyArgs(1);
    }

    [Fact]
    public async Task Resumo_preenche_com_zero_situacoes_tipos_e_meses_sem_chamados()
    {
        var r = await _sut.ResumoAsync(new DateOnly(2026, 1, 10), new DateOnly(2026, 3, 20));
        Assert.Equal(4, r.TotalChamados);
        Assert.Equal(4, r.ChamadosPorSituacao.Count);
        Assert.Equal(0, r.ChamadosPorSituacao.Single(x => x.Rotulo == "Resolvido").Total);
        Assert.Equal(3, r.ChamadosPorTipoContrato.Count);
        Assert.Equal(["01/2026", "02/2026", "03/2026"], r.ChamadosPorMes.Select(m => m.Rotulo));
        Assert.Equal([2, 0, 2], r.ChamadosPorMes.Select(m => m.Total));
    }

    [Fact]
    public async Task Sem_datas_usa_os_ultimos_90_dias()
    {
        var r = await _sut.ResumoAsync(null, null);
        Assert.Equal(90, r.Ate.DayNumber - r.De.DayNumber);
    }

    [Fact]
    public async Task Periodo_invertido_ou_maior_que_um_ano_e_recusado()
    {
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.ResumoAsync(new(2026, 5, 1), new(2026, 4, 1)));
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.ResumoAsync(new(2024, 1, 1), new(2026, 1, 1)));
    }

    [Fact]
    public async Task Periodo_inclui_o_ultimo_dia_inteiro()
    {
        await _sut.ResumoAsync(new DateOnly(2026, 1, 1), new DateOnly(2026, 1, 31));
        await _chamados.Received().ContarPorStatusAsync(new DateTime(2026, 1, 1), new DateTime(2026, 2, 1));
    }

    [Fact]
    public async Task Csv_de_chamados_traz_situacao_em_portugues_e_protege_formulas()
    {
        _chamados.ListarFiltradoAsync(default, default, default, default, default).ReturnsForAnyArgs([
            new Chamado { Id = 1, Titulo = "=HYPERLINK(\"x\")", Status = StatusChamado.EmAndamento, DataAbertura = new(2026, 3, 5, 14, 30, 0),
                          Contrato = new Contrato { Numero = "C-9" }, Cliente = new Usuario { Nome = "Ana" } }]);
        var csv = Encoding.UTF8.GetString(await _sut.ChamadosCsvAsync(new FiltroChamados(null, null, null, null, null))).TrimStart('﻿');
        Assert.Contains("Em andamento", csv);
        Assert.Contains("05/03/2026 14:30", csv);
        Assert.Contains("'=HYPERLINK", csv);
    }

    [Fact]
    public async Task Prazo_de_vencimento_fora_do_intervalo_e_recusado()
    {
        await Assert.ThrowsAsync<RegraNegocioException>(() => _sut.ContratosAsync(new FiltroContratos(null, -1)));
    }
}
