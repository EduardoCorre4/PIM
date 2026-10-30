namespace Jake.Domain.Entities;

/// <summary>Token de renovação de sessão. Só o hash (SHA-256) é guardado; o valor bruto vai apenas ao cliente.</summary>
public class RefreshToken
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime ExpiraEm { get; set; }
    public DateTime? RevogadoEm { get; set; }
}
