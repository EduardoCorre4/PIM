using Jake.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Jake.Repository.Context;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Contrato> Contratos => Set<Contrato>();
    public DbSet<Chamado> Chamados => Set<Chamado>();
    public DbSet<LogAcesso> LogsAcesso => Set<LogAcesso>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Usuario>(e =>
        {
            e.ToTable("USUARIO");
            e.Property(x => x.Nome).HasMaxLength(150).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.SenhaHash).HasMaxLength(300).IsRequired();
            e.Property(x => x.Perfil).HasConversion<int>();
        });

        b.Entity<Contrato>(e =>
        {
            e.ToTable("CONTRATO", t => t.HasCheckConstraint("CK_CONTRATO_VIGENCIA", "[DataFim] >= [DataInicio]"));
            e.Property(x => x.Numero).HasMaxLength(30).IsRequired();
            e.HasIndex(x => x.Numero).IsUnique();
            e.Property(x => x.Descricao).HasMaxLength(500);
            e.Property(x => x.Tipo).HasConversion<int>();
            e.Property(x => x.Status).HasConversion<int>();
            e.Property(x => x.DataInicio).HasColumnType("date");
            e.Property(x => x.DataFim).HasColumnType("date");
            e.HasOne(x => x.Cliente).WithMany(u => u.Contratos)
                .HasForeignKey(x => x.ClienteId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Chamado>(e =>
        {
            e.ToTable("CHAMADO");
            e.Property(x => x.Titulo).HasMaxLength(200).IsRequired();
            e.Property(x => x.Descricao).HasMaxLength(2000);
            e.Property(x => x.Status).HasConversion<int>();
            e.Property(x => x.ChaveIdempotencia).HasMaxLength(64);
            // Um mesmo cliente não pode ter dois chamados com a mesma chave (reenvios do app).
            e.HasIndex(x => new { x.ClienteId, x.ChaveIdempotencia }).IsUnique()
                .HasFilter("[ChaveIdempotencia] IS NOT NULL");
            e.HasOne(x => x.Contrato).WithMany(c => c.Chamados)
                .HasForeignKey(x => x.ContratoId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Cliente).WithMany(u => u.Chamados)
                .HasForeignKey(x => x.ClienteId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<RefreshToken>(e =>
        {
            e.ToTable("REFRESH_TOKEN");
            e.Property(x => x.TokenHash).HasMaxLength(64).IsRequired();
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasOne(x => x.Usuario).WithMany().HasForeignKey(x => x.UsuarioId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<LogAcesso>(e =>
        {
            e.ToTable("LOG_ACESSO");
            e.Property(x => x.Acao).HasMaxLength(200).IsRequired();
            e.Property(x => x.IpOrigem).HasMaxLength(60);
            e.HasOne(x => x.Usuario).WithMany()
                .HasForeignKey(x => x.UsuarioId).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
