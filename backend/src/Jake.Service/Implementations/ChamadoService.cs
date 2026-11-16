using Jake.Domain;
using Jake.Domain.DTOs;
using Jake.Domain.Entities;
using Jake.Domain.Enums;
using Jake.Repository.Interfaces;
using Jake.Service.Interfaces;

namespace Jake.Service.Implementations;

public class ChamadoService(IChamadoRepository chamados, IContratoRepository contratos,
    IMensagemChamadoRepository mensagens, IUsuarioRepository usuarios) : IChamadoService
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
        var criado = await BuscarAsync(id);
        // A descrição inicial vira a primeira mensagem do histórico, assinada pelo cliente.
        if (!string.IsNullOrWhiteSpace(criado.Descricao))
        {
            var autor = await usuarios.ObterPorIdAsync(clienteId);
            await mensagens.AdicionarAsync(new MensagemChamado
            {
                ChamadoId = criado.Id, AutorId = clienteId, AutorNome = autor?.Nome ?? "Cliente",
                AutorPerfil = PerfilUsuario.Cliente, Conteudo = criado.Descricao, DataEnvio = criado.DataAbertura
            });
        }
        return Mapear(criado);
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

    public async Task<ChamadoDetalheResponse> ObterDetalheAsync(int id, int usuarioId, PerfilUsuario perfil)
    {
        var c = await BuscarVisivelAsync(id, usuarioId, perfil);
        var msgs = (await mensagens.ListarAsync(id)).Select(Mapear).ToList();
        // Chamados anteriores ao histórico: a descrição aparece como primeira mensagem do cliente.
        if (msgs.Count == 0 && !string.IsNullOrWhiteSpace(c.Descricao))
            msgs.Add(new MensagemChamadoResponse(0, c.Id, c.ClienteId, c.Cliente?.Nome ?? "Cliente",
                PerfilUsuario.Cliente, c.Descricao, c.DataAbertura));
        return new(c.Id, c.Titulo, c.Descricao, c.Status, c.DataAbertura,
            c.ContratoId, c.Contrato?.Numero, c.ClienteId, c.Cliente?.Nome, msgs);
    }

    public async Task<MensagemChamadoResponse> EnviarMensagemAsync(int id, int usuarioId, PerfilUsuario perfil, string conteudo)
    {
        // Cliente só participa do próprio chamado (404 para não revelar a existência de outros).
        var c = await BuscarVisivelAsync(id, usuarioId, perfil);
        if (c.Status == StatusChamado.Fechado)
            throw new RegraNegocioException("Chamado fechado: reabra o chamado para enviar novas mensagens.");
        var texto = (conteudo ?? string.Empty).Trim();
        if (texto.Length == 0) throw new RegraNegocioException("A mensagem não pode ficar vazia.");

        var autor = await usuarios.ObterPorIdAsync(usuarioId)
            ?? throw new NaoEncontradoException("Usuário não encontrado.");
        var msg = new MensagemChamado
        {
            ChamadoId = id, AutorId = usuarioId, AutorNome = autor.Nome, AutorPerfil = perfil,
            Conteudo = texto, DataEnvio = DateTime.UtcNow
        };
        await mensagens.AdicionarAsync(msg);

        // Primeira resposta da equipe move o chamado de Aberto para Em atendimento.
        if (perfil != PerfilUsuario.Cliente && c.Status == StatusChamado.Aberto)
        {
            c.Status = StatusChamado.EmAndamento;
            await chamados.AtualizarAsync(c);
        }
        return Mapear(msg);
    }

    public async Task<ChamadoResponse> AtualizarStatusAsync(int id, StatusChamado novoStatus, int usuarioId, PerfilUsuario perfil)
    {
        var c = await BuscarVisivelAsync(id, usuarioId, perfil);
        if (!Enum.IsDefined(novoStatus)) throw new RegraNegocioException("Situação inválida.");

        if (c.Status == StatusChamado.Fechado)
        {
            // Reabertura: só o cliente dono ou o gerente; funcionário não reabre.
            if (perfil == PerfilUsuario.Funcionario)
                throw new AcessoNegadoException("Funcionários não podem reabrir chamados fechados.");
            if (novoStatus != StatusChamado.Aberto)
                throw new RegraNegocioException("Chamado fechado só pode ser reaberto (situação Aberto).");
        }
        else if (perfil == PerfilUsuario.Cliente)
        {
            throw new AcessoNegadoException("Clientes só podem reabrir chamados fechados.");
        }

        if (c.Status == novoStatus) return Mapear(c);
        c.Status = novoStatus;
        await chamados.AtualizarAsync(c);
        return Mapear(c);
    }

    /// <summary>Busca o chamado respeitando a visibilidade: cliente só enxerga os próprios.</summary>
    private async Task<Chamado> BuscarVisivelAsync(int id, int usuarioId, PerfilUsuario perfil)
    {
        var c = await BuscarAsync(id);
        if (perfil == PerfilUsuario.Cliente && c.ClienteId != usuarioId)
            throw new NaoEncontradoException("Chamado não encontrado.");
        return c;
    }

    private static MensagemChamadoResponse Mapear(MensagemChamado m) =>
        new(m.Id, m.ChamadoId, m.AutorId, m.AutorNome, m.AutorPerfil, m.Conteudo, m.DataEnvio);

    private async Task<Chamado> BuscarAsync(int id) =>
        await chamados.ObterPorIdAsync(id) ?? throw new NaoEncontradoException("Chamado não encontrado.");

    private static ChamadoResponse Mapear(Chamado c) => new(
        c.Id, c.Titulo, c.Descricao, c.Status, c.DataAbertura,
        c.ContratoId, c.Contrato?.Numero, c.ClienteId, c.Cliente?.Nome);
}
