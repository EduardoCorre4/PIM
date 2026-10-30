using Jake.Domain.DTOs;

namespace Jake.Service.Interfaces;

public interface IContratoService
{
    Task<List<ContratoResponse>> ListarAsync();
    Task<List<ContratoResponse>> ListarDoClienteAsync(int clienteId);
    Task<ContratoResponse> ObterAsync(int id);
    Task<ContratoResponse> CriarAsync(ContratoRequest request);
    Task<ContratoResponse> AtualizarAsync(int id, ContratoRequest request);
    Task RemoverAsync(int id);
}
