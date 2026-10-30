using System.Text;

namespace Jake.Service.Relatorios;

/// <summary>
/// CSV para Excel em português: separador ";", UTF-8 com BOM e quebra de linha CRLF.
/// Células que começam com = + - @ são neutralizadas para evitar injeção de fórmulas ao abrir no Excel.
/// </summary>
public static class CsvBuilder
{
    public static byte[] Gerar(IEnumerable<string> cabecalho, IEnumerable<IEnumerable<string>> linhas)
    {
        var sb = new StringBuilder();
        sb.Append(string.Join(';', cabecalho.Select(Celula))).Append("\r\n");
        foreach (var l in linhas) sb.Append(string.Join(';', l.Select(Celula))).Append("\r\n");
        var utf8 = new UTF8Encoding(encoderShouldEmitUTF8Identifier: true);
        return [.. utf8.GetPreamble(), .. utf8.GetBytes(sb.ToString())];
    }

    public static string Celula(string? valor)
    {
        var v = valor ?? string.Empty;
        if (v.Length > 0 && "=+-@\t\r".Contains(v[0])) v = "'" + v;
        return v.IndexOfAny([';', '"', '\n', '\r']) >= 0 ? "\"" + v.Replace("\"", "\"\"") + "\"" : v;
    }
}
