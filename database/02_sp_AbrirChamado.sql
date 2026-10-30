-- sp_AbrirChamado: abre um chamado SOMENTE se o contrato estiver ATIVO e dentro da vigência.
-- Mantida em sincronia com a migration AddSpAbrirChamado (CREATE OR ALTER é idempotente).
-- Idempotência: se @ChaveIdempotencia já existir para o cliente, devolve o chamado existente (reenvio do app).
-- Códigos de erro: 50001 contrato inexistente | 50002 contrato de outro cliente
--                  50003 contrato não ATIVO    | 50004 fora da vigência
CREATE OR ALTER PROCEDURE dbo.sp_AbrirChamado
    @ContratoId INT,
    @ClienteId  INT,
    @Titulo     NVARCHAR(200),
    @Descricao  NVARCHAR(2000),
    @ChaveIdempotencia NVARCHAR(64) = NULL,
    @ChamadoId  INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON; -- qualquer erro/THROW desfaz a transação

    DECLARE @Hoje DATE = CAST(GETDATE() AS DATE);
    DECLARE @Dono INT, @Status INT, @Inicio DATE, @Fim DATE;

    BEGIN TRANSACTION;

    IF @ChaveIdempotencia IS NOT NULL
    BEGIN
        SELECT @ChamadoId = Id FROM dbo.CHAMADO WITH (UPDLOCK, HOLDLOCK)
        WHERE ClienteId = @ClienteId AND ChaveIdempotencia = @ChaveIdempotencia;
        IF @ChamadoId IS NOT NULL BEGIN COMMIT TRANSACTION; RETURN; END
    END

    -- UPDLOCK/HOLDLOCK: impede que o contrato seja alterado/encerrado entre a validação e o INSERT.
    SELECT @Dono = ClienteId, @Status = [Status], @Inicio = DataInicio, @Fim = DataFim
    FROM dbo.CONTRATO WITH (UPDLOCK, HOLDLOCK)
    WHERE Id = @ContratoId;

    IF @Dono IS NULL           THROW 50001, 'Contrato não encontrado.', 1;
    IF @Dono <> @ClienteId     THROW 50002, 'O contrato informado não pertence ao cliente.', 1;
    IF @Status <> 1            THROW 50003, 'O contrato não está ATIVO.', 1;               -- 1 = Ativo
    IF @Hoje < @Inicio OR @Fim < @Hoje
                               THROW 50004, 'O contrato está fora da vigência.', 1;        -- data_fim >= hoje

    INSERT INTO dbo.CHAMADO (Titulo, Descricao, [Status], DataAbertura, ContratoId, ClienteId, ChaveIdempotencia)
    VALUES (@Titulo, @Descricao, 1, SYSUTCDATETIME(), @ContratoId, @ClienteId, @ChaveIdempotencia);              -- 1 = Aberto

    SET @ChamadoId = SCOPE_IDENTITY();
    COMMIT TRANSACTION;
END
