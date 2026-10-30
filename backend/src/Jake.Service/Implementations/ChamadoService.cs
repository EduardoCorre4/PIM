using Jake.Domain;
using Jake.Domain.DTOs;
using Jake.Domain.Entities;
using Jake.Domain.Enums;
using Jake.Repository.Interfaces;
using Jake.Service.Interfaces;

namespace Jake.Service.Implementations;

public class ChamadoService(IChamadoRepository chamados, IContratoRepository contratos) : IChamadoService
{
    public async Task<ChamadoResponse> AbrirAsync(int clienteId, AbrirChamadoRequest r)
    {
        // Reenvio de um chamado já criado (app offline): devolve o existente, sem revalidar o contrato,
        // pois a regra de vigência valia no momento em que o chamado foi realmente aberto.
        if (!string.IsNullOrWhiteSpace(r.ChaveIdempotencia))
        {
            var existente = await chamados.ObterPorChaveAsync(clienteId, r.ChaveIdempotencia);
            if (existente is not null) return Mapear(existente);
        }

        // Regra de vigência (1/2): validada aqui na camada de Service para dar feedback rápido...
        var contrato = await contratos.ObterPorIdAsync(r.ContratoId)
            ?? throw new NaoEncontradoException("Contrato não encontrado.");
        if (contrato.ClienteId != clienteId)
            throw new RegraNegocioException("O contrato informado não pertence ao cliente.");
        if (contrato.Status != StatusContrato.Ativo)
            throw new RegraNegocioException("O contrato não está ATIVO.");
        var hoje = DateTime.Today;
        if (hoje < contrato.DataInicio.Date || contrato.DataFim.Date < hoje)
            throw new RegraNegocioException("O contrato está fora da vigência.");

        // ...e (2/2) garantida novamente no banco: sp_AbrirChamado revalida dentro de uma transação.
        var id = await chamados.AbrirAsync(r.ContratoId, clienteId, r.Titulo.Trim(), r.Descricao ?? string.Empty, r.ChaveIdempotencia);
        return Mapear(await BuscarAsync(id));
    }

    public async Task<ChamadoResponse> ObterAsync(int id, int usuarioId, PerfilUsuario perfil)
    {
        var c = await BuscarAsync(id);
        // Cliente só enxerga os próprios chamados; responde 404 para não revelar a existência de outros.
        if (perfil == PerfilUsuario.Cliente && c.ClienteId != usuarioId)
            throw new NaoEncontradoException("Chamado não encontrado.");
        return Mapear(c);
    }

    public async Task<List<ChamadoResponse>> ListarDoClienteAsync(int clienteId, StatusChamado? status) =>
        (await chamados.ListarAsync(status, clienteId)).Select(Mapear).ToList();

    public async Task<List<ChamadoResponse>> ListarTodosAsync(StatusChamado? status) =>
        (await chamados.ListarAsync(status)).Select(Mapear).ToList();

    public async Task<ChamadoResponse> AtualizarStatusAsync(int id, StatusChamado novoStatus)
    {
        var c = await BuscarAsync(id);
        if (c.Status == StatusChamado.Fechado)
            throw new RegraNegocioException("Chamados fechados não podem ser alterados.");
        c.Status = novoStatus;
        await chamados.AtualizarAsync(c);
        return Mapear(c);
    }

    private async Task<Chamado> BuscarAsync(int id) =>
        await chamados.ObterPorIdAsync(id) ?? throw new NaoEncontradoException("Chamado não encontrado.");

    private static ChamadoResponse Mapear(Chamado c) => new(
        c.Id, c.Titulo, c.Descricao, c.Status, c.DataAbertura,
        c.ContratoId, c.Contrato?.Numero, c.ClienteId, c.Cliente?.Nome);
}
