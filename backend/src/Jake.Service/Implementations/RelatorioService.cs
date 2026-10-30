using System.Globalization;
using Jake.Domain;
using Jake.Domain.DTOs;
using Jake.Domain.Enums;
using Jake.Repository.Interfaces;
using Jake.Service.Interfaces;
using Jake.Service.Relatorios;

namespace Jake.Service.Implementations;

public class RelatorioService(IChamadoRepository chamados, IContratoRepository contratos) : IRelatorioService
{
    private const int PeriodoPadraoDias = 90;
    private const int PeriodoMaximoDias = 366;

    public async Task<RelatorioResumoResponse> ResumoAsync(DateOnly? de, DateOnly? ate)
    {
        var (inicio, fim) = Periodo(de, ate);
        var (ini, fimExcl) = (inicio.ToDateTime(TimeOnly.MinValue), fim.AddDays(1).ToDateTime(TimeOnly.MinValue));
        var hoje = DateTime.UtcNow.Date;

        var porStatus = await chamados.ContarPorStatusAsync(ini, fimExcl);
        var porMes = (await chamados.ContarPorMesAsync(ini, fimExcl)).ToDictionary(x => (x.Ano, x.Mes), x => x.Total);
        var porTipo = (await chamados.ContarPorTipoContratoAsync(ini, fimExcl)).ToDictionary(x => x.Tipo, x => x.Total);
        var topClientes = await chamados.ClientesComMaisChamadosAsync(ini, fimExcl, 5);

        // Meses sem chamados aparecem com 0, para o gráfico/tabela não ter "buracos".
        var meses = new List<ItemContagem>();
        for (var m = new DateOnly(inicio.Year, inicio.Month, 1); m <= fim; m = m.AddMonths(1))
            meses.Add(new($"{m.Month:00}/{m.Year}", porMes.GetValueOrDefault((m.Year, m.Month))));

        return new RelatorioResumoResponse(
            inicio, fim,
            porStatus.Values.Sum(),
            Enum.GetValues<StatusChamado>().Select(s => new ItemContagem(Rotulos.De(s), porStatus.GetValueOrDefault(s))).ToList(),
            meses,
            Enum.GetValues<TipoContrato>().Select(t => new ItemContagem(Rotulos.De(t), porTipo.GetValueOrDefault(t))).ToList(),
            topClientes.Select(c => new ItemContagem(c.Cliente, c.Total)).ToList(),
            await chamados.ContarSemSolucaoAbertosAntesDeAsync(DateTime.UtcNow.AddDays(-7)),
            await contratos.ContarAtivosVencendoAsync(hoje, 30),
            await contratos.ContarAtivosVencendoAsync(hoje, 60),
            await contratos.ContarAtivosVencendoAsync(hoje, 90),
            await contratos.ContarAtivosVencidosAsync(hoje));
    }

    public async Task<List<ChamadoResponse>> ChamadosAsync(FiltroChamados f)
    {
        var (ini, fimExcl) = LimitesOpcionais(f.De, f.Ate);
        return (await chamados.ListarFiltradoAsync(ini, fimExcl, f.Status, f.ContratoId, f.ClienteId))
            .Select(c => new ChamadoResponse(c.Id, c.Titulo, c.Descricao, c.Status, c.DataAbertura,
                c.ContratoId, c.Contrato?.Numero, c.ClienteId, c.Cliente?.Nome)).ToList();
    }

    public async Task<List<ContratoResponse>> ContratosAsync(FiltroContratos f)
    {
        if (f.VenceEmDias is < 0 or > 3650) throw new RegraNegocioException("Informe um prazo de vencimento entre 0 e 3650 dias.");
        var hoje = DateTime.UtcNow.Date;
        return (await contratos.ListarFiltradoAsync(f.Status, f.VenceEmDias is { } d ? hoje.AddDays(d) : null, hoje))
            .Select(c => new ContratoResponse(c.Id, c.Numero, c.Descricao, c.Tipo, c.Status, c.DataInicio, c.DataFim, c.ClienteId, c.Cliente?.Nome))
            .ToList();
    }

    public async Task<byte[]> ChamadosCsvAsync(FiltroChamados filtro)
    {
        var l = await ChamadosAsync(filtro);
        return CsvBuilder.Gerar(
            ["Número", "Assunto", "Situação", "Aberto em (UTC)", "Contrato", "Cliente", "Descrição"],
            l.Select(c => new[]
            {
                c.Id.ToString(CultureInfo.InvariantCulture), c.Titulo, Rotulos.De(c.Status),
                c.DataAbertura.ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture),
                c.ContratoNumero ?? "", c.ClienteNome ?? "", c.Descricao
            }));
    }

    public async Task<byte[]> ContratosCsvAsync(FiltroContratos filtro)
    {
        var l = await ContratosAsync(filtro);
        return CsvBuilder.Gerar(
            ["Número", "Cliente", "Serviço", "Situação", "Início", "Término", "Descrição"],
            l.Select(c => new[]
            {
                c.Numero, c.ClienteNome ?? "", Rotulos.De(c.Tipo), Rotulos.De(c.Status),
                c.DataInicio.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture),
                c.DataFim.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture), c.Descricao
            }));
    }

    /// <summary>Sem datas: últimos 90 dias. O período máximo evita relatórios que sobrecarregam o banco.</summary>
    private static (DateOnly De, DateOnly Ate) Periodo(DateOnly? de, DateOnly? ate)
    {
        var fim = ate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var inicio = de ?? fim.AddDays(-PeriodoPadraoDias);
        if (inicio > fim) throw new RegraNegocioException("A data inicial não pode ser depois da data final.");
        if (fim.DayNumber - inicio.DayNumber > PeriodoMaximoDias)
            throw new RegraNegocioException("O período do relatório pode ter no máximo 1 ano.");
        return (inicio, fim);
    }

    private static (DateTime? Ini, DateTime? FimExcl) LimitesOpcionais(DateOnly? de, DateOnly? ate)
    {
        if (de > ate) throw new RegraNegocioException("A data inicial não pode ser depois da data final.");
        return (de?.ToDateTime(TimeOnly.MinValue), ate?.AddDays(1).ToDateTime(TimeOnly.MinValue));
    }
}
