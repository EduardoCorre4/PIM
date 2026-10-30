using Jake.Domain;
using Microsoft.AspNetCore.Mvc;

namespace Jake.Api.Middleware;

/// <summary>Traduz exceções de domínio em respostas HTTP (ProblemDetails).</summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try { await next(ctx); }
        catch (Exception ex)
        {
            var (status, title) = ex switch
            {
                RegraNegocioException => (StatusCodes.Status400BadRequest, ex.Message),
                NaoEncontradoException => (StatusCodes.Status404NotFound, ex.Message),
                NaoAutorizadoException => (StatusCodes.Status401Unauthorized, ex.Message),
                _ => (StatusCodes.Status500InternalServerError, "Erro interno do servidor.")
            };
            if (status == 500) logger.LogError(ex, "Erro não tratado");
            ctx.Response.StatusCode = status;
            await ctx.Response.WriteAsJsonAsync(new ProblemDetails { Status = status, Title = title });
        }
    }
}
