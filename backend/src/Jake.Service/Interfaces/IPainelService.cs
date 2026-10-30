using Jake.Domain.DTOs;
using Jake.Domain.Enums;

namespace Jake.Service.Interfaces;

public interface IPainelService
{
    Task<IndicadoresResponse> ObterIndicadoresAsync();
    Task<ContratoResponse> AlterarStatusContratoAsync(int contratoId, StatusContrato status);
}
