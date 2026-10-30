using System.Security.Cryptography;

namespace Jake.Service.Implementations;

/// <summary>PBKDF2-SHA256 com salt aleatório. Formato: iterações.salt.hash (base64).</summary>
public static class PasswordHasher
{
    private const int Iteracoes = 100_000;
    private const int TamanhoSalt = 16;
    private const int TamanhoHash = 32;

    public static string Hash(string senha)
    {
        var salt = RandomNumberGenerator.GetBytes(TamanhoSalt);
        var hash = Rfc2898DeriveBytes.Pbkdf2(senha, salt, Iteracoes, HashAlgorithmName.SHA256, TamanhoHash);
        return $"{Iteracoes}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool Verificar(string senha, string armazenado)
    {
        var partes = armazenado.Split('.');
        if (partes.Length != 3 || !int.TryParse(partes[0], out var it)) return false;
        var salt = Convert.FromBase64String(partes[1]);
        var esperado = Convert.FromBase64String(partes[2]);
        var hash = Rfc2898DeriveBytes.Pbkdf2(senha, salt, it, HashAlgorithmName.SHA256, esperado.Length);
        return CryptographicOperations.FixedTimeEquals(hash, esperado);
    }
}
