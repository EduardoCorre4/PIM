using Jake.Domain.Entities;
using Jake.Domain.Enums;
using Jake.Repository.Context;
using Jake.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Jake.Repository.Implementations;

public class UsuarioRepository(AppDbContext db) : IUsuarioRepository
{
    public Task<Usuario?> ObterPorIdAsync(int id) => db.Usuarios.FirstOrDefaultAsync(u => u.Id == id);

    public Task<Usuario?> ObterPorEmailAsync(string email) =>
        db.Usuarios.FirstOrDefaultAsync(u => u.Email == email);

    public Task<bool> EmailExisteAsync(string email) => db.Usuarios.AnyAsync(u => u.Email == email);

    public async Task AdicionarAsync(Usuario usuario)
    {
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();
    }

    public Task<List<Usuario>> ListarAsync(PerfilUsuario? perfil = null) =>
        db.Usuarios.AsNoTracking().Where(u => u.Ativo && (perfil == null || u.Perfil == perfil))
            .OrderBy(u => u.Nome).ToListAsync();
}
