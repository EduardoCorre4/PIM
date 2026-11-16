using Jake.Domain.Entities;

namespace Jake.Repository.Interfaces;

public interface IMensagemChamadoRepository
{
    /// <summary>Mensagens do chamado, da mais antiga para a mais nova.</summary>
    Task<List<MensagemChamado>> ListarAsync(int chamadoId);
    Task AdicionarAsync(MensagemChamado mensagem);
}
