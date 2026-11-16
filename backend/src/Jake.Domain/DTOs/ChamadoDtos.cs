using System.ComponentModel.DataAnnotations;
using Jake.Domain.Enums;

namespace Jake.Domain.DTOs;

public record AbrirChamadoRequest(
    int ContratoId,
    [Required, StringLength(200)] string Titulo,
    [StringLength(2000)] string Descricao,
    [StringLength(64)] string? ChaveIdempotencia = null);

public record AtualizarStatusChamadoRequest(StatusChamado Status);

public record ChamadoResponse(
    int Id, string Titulo, string Descricao, StatusChamado Status, DateTime DataAbertura,
    int ContratoId, string? ContratoNumero, int ClienteId, string? ClienteNome);

public record EnviarMensagemRequest([Required, StringLength(2000, MinimumLength = 1)] string Conteudo);

public record MensagemChamadoResponse(
    int Id, int ChamadoId, int AutorId, string AutorNome, PerfilUsuario AutorPerfil, string Conteudo, DateTime DataEnvio);

/// <summary>Detalhe do chamado + histórico ordenado do mais antigo para o mais novo.</summary>
public record ChamadoDetalheResponse(
    int Id, string Titulo, string Descricao, StatusChamado Status, DateTime DataAbertura,
    int ContratoId, string? ContratoNumero, int ClienteId, string? ClienteNome,
    List<MensagemChamadoResponse> Mensagens);

public record AtualizarStatusContratoRequest(StatusContrato Status);

public record IndicadoresResponse(
    Dictionary<string, int> ChamadosPorStatus,
    Dictionary<string, int> ContratosPorStatus,
    int ContratosAtivosVencendoEm30Dias);
