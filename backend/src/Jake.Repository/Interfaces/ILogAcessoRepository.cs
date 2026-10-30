using Jake.Domain.Entities;

namespace Jake.Repository.Interfaces;

public interface ILogAcessoRepository
{
    Task AdicionarAsync(LogAcesso log);
}
