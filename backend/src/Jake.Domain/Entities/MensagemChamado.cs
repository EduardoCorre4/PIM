using Jake.Domain.Enums;

namespace Jake.Domain.Entities;

/// <summary>Mensagem do histórico de atendimento (conversa assíncrona) de um chamado.</summary>
public class MensagemChamado
{
    public int Id { get; set; }
    public int ChamadoId { get; set; }
    public Chamado? Chamado { get; set; }
    public int AutorId { get; set; }
    /// <summary>Cópia do nome/perfil no momento do envio: o histórico não muda se o usuário for renomeado.</summary>
    public string AutorNome { get; set; } = string.Empty;
    public PerfilUsuario AutorPerfil { get; set; }
    public string Conteudo { get; set; } = string.Empty;
    public DateTime DataEnvio { get; set; } = DateTime.UtcNow;
}
