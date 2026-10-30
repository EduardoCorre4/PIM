using Jake.Domain.Enums;

namespace Jake.Service.Relatorios;

/// <summary>Textos em português usados nos relatórios e no CSV.</summary>
public static class Rotulos
{
    public static string De(StatusChamado s) => s switch
    {
        StatusChamado.Aberto => "Aberto",
        StatusChamado.EmAndamento => "Em andamento",
        StatusChamado.Resolvido => "Resolvido",
        StatusChamado.Fechado => "Fechado",
        _ => s.ToString()
    };

    public static string De(StatusContrato s) => s switch
    {
        StatusContrato.Ativo => "Ativo",
        StatusContrato.Inativo => "Inativo",
        StatusContrato.Encerrado => "Encerrado",
        _ => s.ToString()
    };

    public static string De(TipoContrato t) => t switch
    {
        TipoContrato.SI => "Sistemas",
        TipoContrato.SP => "Suporte",
        TipoContrato.CS => "Segurança na nuvem",
        _ => t.ToString()
    };
}
