using System.ComponentModel.DataAnnotations;
using Jake.Domain.Enums;

namespace Jake.Domain.DTOs;

public record ContratoRequest(
    [Required, StringLength(30)] string Numero,
    [StringLength(500)] string Descricao,
    TipoContrato Tipo,
    StatusContrato Status,
    DateTime DataInicio,
    DateTime DataFim,
    int ClienteId);

public record ContratoResponse(
    int Id, string Numero, string Descricao, TipoContrato Tipo, StatusContrato Status,
    DateTime DataInicio, DateTime DataFim, int ClienteId, string? ClienteNome);
