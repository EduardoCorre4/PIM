using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jake.Repository.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "USUARIO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SenhaHash = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Perfil = table.Column<int>(type: "int", nullable: false),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USUARIO", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CONTRATO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Numero = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Tipo = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    DataInicio = table.Column<DateTime>(type: "date", nullable: false),
                    DataFim = table.Column<DateTime>(type: "date", nullable: false),
                    ClienteId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CONTRATO", x => x.Id);
                    table.CheckConstraint("CK_CONTRATO_VIGENCIA", "[DataFim] >= [DataInicio]");
                    table.ForeignKey(
                        name: "FK_CONTRATO_USUARIO_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "USUARIO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LOG_ACESSO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    Acao = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Sucesso = table.Column<bool>(type: "bit", nullable: false),
                    IpOrigem = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    DataHora = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LOG_ACESSO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LOG_ACESSO_USUARIO_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "USUARIO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CHAMADO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Titulo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    DataAbertura = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ContratoId = table.Column<int>(type: "int", nullable: false),
                    ClienteId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CHAMADO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CHAMADO_CONTRATO_ContratoId",
                        column: x => x.ContratoId,
                        principalTable: "CONTRATO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CHAMADO_USUARIO_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "USUARIO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CHAMADO_ClienteId",
                table: "CHAMADO",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_CHAMADO_ContratoId",
                table: "CHAMADO",
                column: "ContratoId");

            migrationBuilder.CreateIndex(
                name: "IX_CONTRATO_ClienteId",
                table: "CONTRATO",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_CONTRATO_Numero",
                table: "CONTRATO",
                column: "Numero",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LOG_ACESSO_UsuarioId",
                table: "LOG_ACESSO",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_USUARIO_Email",
                table: "USUARIO",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CHAMADO");

            migrationBuilder.DropTable(
                name: "LOG_ACESSO");

            migrationBuilder.DropTable(
                name: "CONTRATO");

            migrationBuilder.DropTable(
                name: "USUARIO");
        }
    }
}
