using Jake.Domain;
using Jake.Domain.DTOs;
using Jake.Domain.Enums;
using Jake.Repository.Interfaces;
using Jake.Service.Interfaces;

namespace Jake.Service.Implementations;

public class PainelService(IChamadoRepository chamados, IContratoRepository contratos, IContratoService contratoService)
    : IPainelService
{
    public async Task<IndicadoresResponse> ObterIndicadoresAsync()
    {
        var porChamado = await chamados.ContarPorStatusAsync();
        var porContrato = await contratos.ContarPorStatusAsync();
        // Inclui status sem registros (valor 0) para o painel não precisar tratar chaves ausentes.
        return new IndicadoresResponse(
            Enum.GetValues<StatusChamado>().ToDictionary(s => s.ToString(), s => porChamado.GetValueOrDefault(s)),
            Enum.GetValues<StatusContrato>().ToDictionary(s => s.ToString(), s => porContrato.GetValueOrDefault(s)),
            await contratos.ContarAtivosVencendoAsync(DateTime.Today, 30));
    }

    /// <summary>Edição rápida (ativar/inativar/encerrar) reaproveitando as validações do ContratoService.</summary>
    public async Task<ContratoResponse> AlterarStatusContratoAsync(int contratoId, StatusContrato status)
    {
        var c = await contratoService.ObterAsync(contratoId);
        return await contratoService.AtualizarAsync(contratoId, new ContratoRequest(
            c.Numero, c.Descricao, c.Tipo, status, c.DataInicio, c.DataFim, c.ClienteId));
    }
}
