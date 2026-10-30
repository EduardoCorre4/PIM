using Jake.Domain.Enums;

namespace Jake.Domain.Entities;

public class Usuario
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SenhaHash { get; set; } = string.Empty;
    public PerfilUsuario Perfil { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public ICollection<Contrato> Contratos { get; set; } = new List<Contrato>();
    public ICollection<Chamado> Chamados { get; set; } = new List<Chamado>();
}
