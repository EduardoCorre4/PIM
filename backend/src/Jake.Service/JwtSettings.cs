namespace Jake.Service;

public class JwtSettings
{
    public const string Section = "Jwt";
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "Jake.Api";
    public string Audience { get; set; } = "Jake.Clients";
    public int ExpiracaoMinutos { get; set; } = 120;
    public int RefreshExpiracaoDias { get; set; } = 30;
}
