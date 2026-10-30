IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030004949_InitialCreate'
)
BEGIN
    CREATE TABLE [USUARIO] (
        [Id] int NOT NULL IDENTITY,
        [Nome] nvarchar(150) NOT NULL,
        [Email] nvarchar(200) NOT NULL,
        [SenhaHash] nvarchar(300) NOT NULL,
        [Perfil] int NOT NULL,
        [Ativo] bit NOT NULL,
        [CriadoEm] datetime2 NOT NULL,
        CONSTRAINT [PK_USUARIO] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030004949_InitialCreate'
)
BEGIN
    CREATE TABLE [CONTRATO] (
        [Id] int NOT NULL IDENTITY,
        [Numero] nvarchar(30) NOT NULL,
        [Descricao] nvarchar(500) NOT NULL,
        [Tipo] int NOT NULL,
        [Status] int NOT NULL,
        [DataInicio] date NOT NULL,
        [DataFim] date NOT NULL,
        [ClienteId] int NOT NULL,
        CONSTRAINT [PK_CONTRATO] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_CONTRATO_VIGENCIA] CHECK ([DataFim] >= [DataInicio]),
        CONSTRAINT [FK_CONTRATO_USUARIO_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [USUARIO] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030004949_InitialCreate'
)
BEGIN
    CREATE TABLE [LOG_ACESSO] (
        [Id] int NOT NULL IDENTITY,
        [UsuarioId] int NULL,
        [Acao] nvarchar(200) NOT NULL,
        [Sucesso] bit NOT NULL,
        [IpOrigem] nvarchar(60) NULL,
        [DataHora] datetime2 NOT NULL,
        CONSTRAINT [PK_LOG_ACESSO] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_LOG_ACESSO_USUARIO_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [USUARIO] ([Id]) ON DELETE SET NULL
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030004949_InitialCreate'
)
BEGIN
    CREATE TABLE [CHAMADO] (
        [Id] int NOT NULL IDENTITY,
        [Titulo] nvarchar(200) NOT NULL,
        [Descricao] nvarchar(2000) NOT NULL,
        [Status] int NOT NULL,
        [DataAbertura] datetime2 NOT NULL,
        [ContratoId] int NOT NULL,
        [ClienteId] int NOT NULL,
        CONSTRAINT [PK_CHAMADO] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CHAMADO_CONTRATO_ContratoId] FOREIGN KEY ([ContratoId]) REFERENCES [CONTRATO] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_CHAMADO_USUARIO_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [USUARIO] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030004949_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CHAMADO_ClienteId] ON [CHAMADO] ([ClienteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030004949_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CHAMADO_ContratoId] ON [CHAMADO] ([ContratoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030004949_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CONTRATO_ClienteId] ON [CONTRATO] ([ClienteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030004949_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CONTRATO_Numero] ON [CONTRATO] ([Numero]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030004949_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_LOG_ACESSO_UsuarioId] ON [LOG_ACESSO] ([UsuarioId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030004949_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_USUARIO_Email] ON [USUARIO] ([Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030004949_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261030004949_InitialCreate', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030010401_AddSpAbrirChamado'
)
BEGIN
    CREATE OR ALTER PROCEDURE dbo.sp_AbrirChamado
        @ContratoId INT,
        @ClienteId  INT,
        @Titulo     NVARCHAR(200),
        @Descricao  NVARCHAR(2000),
        @ChamadoId  INT OUTPUT
    AS
    BEGIN
        SET NOCOUNT ON;
        SET XACT_ABORT ON; -- qualquer erro/THROW desfaz a transação

        DECLARE @Hoje DATE = CAST(GETDATE() AS DATE);
        DECLARE @Dono INT, @Status INT, @Inicio DATE, @Fim DATE;

        BEGIN TRANSACTION;

        -- UPDLOCK/HOLDLOCK: impede que o contrato seja alterado/encerrado entre a validação e o INSERT.
        SELECT @Dono = ClienteId, @Status = [Status], @Inicio = DataInicio, @Fim = DataFim
        FROM dbo.CONTRATO WITH (UPDLOCK, HOLDLOCK)
        WHERE Id = @ContratoId;

        IF @Dono IS NULL           THROW 50001, 'Contrato não encontrado.', 1;
        IF @Dono <> @ClienteId     THROW 50002, 'O contrato informado não pertence ao cliente.', 1;
        IF @Status <> 1            THROW 50003, 'O contrato não está ATIVO.', 1;               -- 1 = Ativo
        IF @Hoje < @Inicio OR @Fim < @Hoje
                                   THROW 50004, 'O contrato está fora da vigência.', 1;        -- data_fim >= hoje

        INSERT INTO dbo.CHAMADO (Titulo, Descricao, [Status], DataAbertura, ContratoId, ClienteId)
        VALUES (@Titulo, @Descricao, 1, SYSUTCDATETIME(), @ContratoId, @ClienteId);              -- 1 = Aberto

        SET @ChamadoId = SCOPE_IDENTITY();
        COMMIT TRANSACTION;
    END
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030010401_AddSpAbrirChamado'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261030010401_AddSpAbrirChamado', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030012644_AddRefreshTokenEIdempotencia'
)
BEGIN
    DROP INDEX [IX_CHAMADO_ClienteId] ON [CHAMADO];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030012644_AddRefreshTokenEIdempotencia'
)
BEGIN
    ALTER TABLE [CHAMADO] ADD [ChaveIdempotencia] nvarchar(64) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030012644_AddRefreshTokenEIdempotencia'
)
BEGIN
    CREATE TABLE [REFRESH_TOKEN] (
        [Id] int NOT NULL IDENTITY,
        [UsuarioId] int NOT NULL,
        [TokenHash] nvarchar(64) NOT NULL,
        [CriadoEm] datetime2 NOT NULL,
        [ExpiraEm] datetime2 NOT NULL,
        [RevogadoEm] datetime2 NULL,
        CONSTRAINT [PK_REFRESH_TOKEN] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_REFRESH_TOKEN_USUARIO_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [USUARIO] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030012644_AddRefreshTokenEIdempotencia'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_CHAMADO_ClienteId_ChaveIdempotencia] ON [CHAMADO] ([ClienteId], [ChaveIdempotencia]) WHERE [ChaveIdempotencia] IS NOT NULL');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030012644_AddRefreshTokenEIdempotencia'
)
BEGIN
    CREATE UNIQUE INDEX [IX_REFRESH_TOKEN_TokenHash] ON [REFRESH_TOKEN] ([TokenHash]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030012644_AddRefreshTokenEIdempotencia'
)
BEGIN
    CREATE INDEX [IX_REFRESH_TOKEN_UsuarioId] ON [REFRESH_TOKEN] ([UsuarioId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030012644_AddRefreshTokenEIdempotencia'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030012644_AddRefreshTokenEIdempotencia'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261030012644_AddRefreshTokenEIdempotencia', N'8.0.11');
END;
GO

COMMIT;
GO

