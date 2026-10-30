using Jake.Domain.Entities;
using Jake.Domain.Enums;

namespace Jake.Tests;

internal static class Fabrica
{
    public static Usuario Cliente(int id = 2) => new() { Id = id, Nome = "Ana", Email = "ana@x.com", Perfil = PerfilUsuario.Cliente, Ativo = true };

    public static Contrato Contrato(int id = 1, int clienteId = 2, StatusContrato status = StatusContrato.Ativo,
        int inicioEmDias = -30, int fimEmDias = 30) => new()
    {
        Id = id, Numero = $"C-{id}", ClienteId = clienteId, Status = status, Tipo = TipoContrato.SP,
        DataInicio = DateTime.Today.AddDays(inicioEmDias), DataFim = DateTime.Today.AddDays(fimEmDias)
    };
}
