using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jake.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddRefreshTokenEIdempotencia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CHAMADO_ClienteId",
                table: "CHAMADO");

            migrationBuilder.AddColumn<string>(
                name: "ChaveIdempotencia",
                table: "CHAMADO",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "REFRESH_TOKEN",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiraEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevogadoEm = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_REFRESH_TOKEN", x => x.Id);
                    table.ForeignKey(
                        name: "FK_REFRESH_TOKEN_USUARIO_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "USUARIO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CHAMADO_ClienteId_ChaveIdempotencia",
                table: "CHAMADO",
                columns: new[] { "ClienteId", "ChaveIdempotencia" },
                unique: true,
                filter: "[ChaveIdempotencia] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_REFRESH_TOKEN_TokenHash",
                table: "REFRESH_TOKEN",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_REFRESH_TOKEN_UsuarioId",
                table: "REFRESH_TOKEN",
                column: "UsuarioId");
            // sp_AbrirChamado passa a aceitar a chave de idempotência (mesmo conteúdo de database/02_sp_AbrirChamado.sql).
            migrationBuilder.Sql(@"CREATE OR ALTER PROCEDURE dbo.sp_AbrirChamado
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
END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "REFRESH_TOKEN");

            migrationBuilder.DropIndex(
                name: "IX_CHAMADO_ClienteId_ChaveIdempotencia",
                table: "CHAMADO");

            migrationBuilder.DropColumn(
                name: "ChaveIdempotencia",
                table: "CHAMADO");

            migrationBuilder.CreateIndex(
                name: "IX_CHAMADO_ClienteId",
                table: "CHAMADO",
                column: "ClienteId");
        }
    }
}
