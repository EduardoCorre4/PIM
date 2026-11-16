using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jake.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddMensagemChamado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MENSAGEM_CHAMADO",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChamadoId = table.Column<int>(type: "int", nullable: false),
                    AutorId = table.Column<int>(type: "int", nullable: false),
                    AutorNome = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    AutorPerfil = table.Column<int>(type: "int", nullable: false),
                    Conteudo = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    DataEnvio = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MENSAGEM_CHAMADO", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MENSAGEM_CHAMADO_CHAMADO_ChamadoId",
                        column: x => x.ChamadoId,
                        principalTable: "CHAMADO",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MENSAGEM_CHAMADO_ChamadoId_DataEnvio",
                table: "MENSAGEM_CHAMADO",
                columns: new[] { "ChamadoId", "DataEnvio" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MENSAGEM_CHAMADO");
        }
    }
}
