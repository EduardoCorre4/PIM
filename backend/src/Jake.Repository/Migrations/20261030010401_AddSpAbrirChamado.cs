using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jake.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddSpAbrirChamado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Regra de negócio no banco: mesmo conteúdo de database/02_sp_AbrirChamado.sql.
            migrationBuilder.Sql(@"CREATE OR ALTER PROCEDURE dbo.sp_AbrirChamado
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
END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS dbo.sp_AbrirChamado");
        }
    }
}
