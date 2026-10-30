namespace Jake.Domain;

/// <summary>Violação de regra de negócio (mapeada para HTTP 400/409 na API).</summary>
public class RegraNegocioException(string message) : Exception(message);

public class NaoEncontradoException(string message) : Exception(message);

public class NaoAutorizadoException(string message) : Exception(message);
