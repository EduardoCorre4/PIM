using Jake.Domain.DTOs;
using Jake.Domain.Enums;

namespace Jake.Service.Interfaces;

public interface IChamadoService
{
    Task<ChamadoResponse> AbrirAsync(int clienteId, AbrirChamadoRequest request);
    Task<ChamadoResponse> ObterAsync(int id, int usuarioId, PerfilUsuario perfil);
    Task<List<ChamadoResponse>> ListarDoClienteAsync(int clienteId, StatusChamado? status);
    Task<List<ChamadoResponse>> ListarTodosAsync(StatusChamado? status);
    Task<ChamadoResponse> AtualizarStatusAsync(int id, StatusChamado novoStatus);
}
