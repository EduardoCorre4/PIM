using Jake.Domain.Enums;

namespace Jake.Domain.Entities;

/// <summary>Chamado técnico vinculado a um Contrato e a um Cliente. A abertura é feita na Sprint 2 (sp_AbrirChamado).</summary>
public class Chamado
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public StatusChamado Status { get; set; } = StatusChamado.Aberto;
    public DateTime DataAbertura { get; set; } = DateTime.UtcNow;
    public int ContratoId { get; set; }
    public Contrato? Contrato { get; set; }
    /// <summary>Gerada pelo app ao criar o chamado offline; evita duplicar o chamado se o envio for repetido.</summary>
    public string? ChaveIdempotencia { get; set; }
    public int ClienteId { get; set; }
    public Usuario? Cliente { get; set; }
}
