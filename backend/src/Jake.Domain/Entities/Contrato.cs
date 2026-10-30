using Jake.Domain.Enums;

namespace Jake.Domain.Entities;

/// <summary>Contrato (CTO) firmado com um cliente. Define a vigência usada na abertura de chamados.</summary>
public class Contrato
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public TipoContrato Tipo { get; set; }
    public StatusContrato Status { get; set; } = StatusContrato.Ativo;
    public DateTime DataInicio { get; set; }
    public DateTime DataFim { get; set; }
    public int ClienteId { get; set; }
    public Usuario? Cliente { get; set; }

    public ICollection<Chamado> Chamados { get; set; } = new List<Chamado>();
}
