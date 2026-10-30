namespace Jake.Domain.Entities;

public class LogAcesso
{
    public int Id { get; set; }
    public int? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string Acao { get; set; } = string.Empty;
    public bool Sucesso { get; set; }
    public string? IpOrigem { get; set; }
    public DateTime DataHora { get; set; } = DateTime.UtcNow;
}
