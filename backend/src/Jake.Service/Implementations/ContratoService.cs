using Jake.Domain;
using Jake.Domain.DTOs;
using Jake.Domain.Entities;
using Jake.Domain.Enums;
using Jake.Repository.Interfaces;
using Jake.Service.Interfaces;

namespace Jake.Service.Implementations;

public class ContratoService(IContratoRepository contratos, IUsuarioRepository usuarios) : IContratoService
{
    public async Task<List<ContratoResponse>> ListarAsync() =>
        (await contratos.ListarAsync()).Select(Mapear).ToList();

    public async Task<List<ContratoResponse>> ListarDoClienteAsync(int clienteId) =>
        (await contratos.ListarPorClienteAsync(clienteId)).Select(Mapear).ToList();

    public async Task<ContratoResponse> ObterAsync(int id) => Mapear(await BuscarAsync(id));

    public async Task<ContratoResponse> CriarAsync(ContratoRequest r)
    {
        await ValidarAsync(r, null);
        var c = new Contrato();
        Aplicar(c, r);
        await contratos.AdicionarAsync(c);
        return Mapear(await BuscarAsync(c.Id));
    }

    public async Task<ContratoResponse> AtualizarAsync(int id, ContratoRequest r)
    {
        var c = await BuscarAsync(id);
        await ValidarAsync(r, id);
        Aplicar(c, r);
        await contratos.AtualizarAsync(c);
        return Mapear(await BuscarAsync(id));
    }

    public async Task RemoverAsync(int id)
    {
        var c = await BuscarAsync(id);
        // Contratos com chamados são histórico: o banco bloqueia a exclusão (FK), então avisamos de forma clara.
        if (await contratos.PossuiChamadosAsync(id))
            throw new RegraNegocioException("Este contrato possui chamados e não pode ser excluído. Altere a situação para Encerrado.");
        await contratos.RemoverAsync(c);
    }

    private async Task<Contrato> BuscarAsync(int id) =>
        await contratos.ObterPorIdAsync(id) ?? throw new NaoEncontradoException("Contrato não encontrado.");

    /// <summary>Regras: vigência coerente, número único e dono do contrato deve ser um Cliente ativo.</summary>
    private async Task ValidarAsync(ContratoRequest r, int? idAtual)
    {
        if (r.DataFim < r.DataInicio)
            throw new RegraNegocioException("A data de fim não pode ser anterior à data de início.");
        if (await contratos.NumeroExisteAsync(r.Numero.Trim(), idAtual))
            throw new RegraNegocioException("Já existe um contrato com este número.");
        var cliente = await usuarios.ObterPorIdAsync(r.ClienteId);
        if (cliente is not { Ativo: true, Perfil: PerfilUsuario.Cliente })
            throw new RegraNegocioException("O cliente informado não existe ou não possui perfil de Cliente.");
    }

    private static void Aplicar(Contrato c, ContratoRequest r)
    {
        c.Numero = r.Numero.Trim();
        c.Descricao = r.Descricao;
        c.Tipo = r.Tipo;
        c.Status = r.Status;
        c.DataInicio = r.DataInicio.Date;
        c.DataFim = r.DataFim.Date;
        c.ClienteId = r.ClienteId;
    }

    private static ContratoResponse Mapear(Contrato c) => new(
        c.Id, c.Numero, c.Descricao, c.Tipo, c.Status, c.DataInicio, c.DataFim, c.ClienteId, c.Cliente?.Nome);
}
