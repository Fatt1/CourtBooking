using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchSportTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BranchSportTypes",
                columns: table => new
                {
                    BranchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SportTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BranchSportTypes", x => new { x.BranchId, x.SportTypeId });
                    table.ForeignKey(
                        name: "FK_BranchSportTypes_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BranchSportTypes_SportType_SportTypeId",
                        column: x => x.SportTypeId,
                        principalTable: "SportType",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BranchSportTypes_SportTypeId",
                table: "BranchSportTypes",
                column: "SportTypeId");

            migrationBuilder.Sql("INSERT INTO BranchSportTypes (BranchId, SportTypeId) SELECT Id, SportTypeId FROM Branches;");

            // Existing rows from AddBranchHotline had an empty default. Reuse the owner's
            // known phone number when available; do not invent a number for other rows.
            migrationBuilder.Sql("""
                UPDATE b SET Hotline = LEFT(u.PhoneNumber, 20)
                FROM Branches AS b
                INNER JOIN Users AS u ON u.Id = b.CourtOwnerId
                WHERE b.Hotline = '' AND NULLIF(LTRIM(RTRIM(u.PhoneNumber)), '') IS NOT NULL;
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_Branches_SportType_SportTypeId",
                table: "Branches");

            migrationBuilder.DropIndex(
                name: "IX_Branches_SportTypeId",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "SportTypeId",
                table: "Branches");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT b.Id FROM Branches AS b
                    LEFT JOIN BranchSportTypes AS bst ON bst.BranchId = b.Id
                    GROUP BY b.Id HAVING COUNT(bst.SportTypeId) <> 1
                )
                BEGIN
                    ;THROW 50001, 'Cannot roll back: every branch must have exactly one sport type.', 1;
                END;
                """);

            migrationBuilder.AddColumn<Guid>(
                name: "SportTypeId",
                table: "Branches",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE b SET SportTypeId = bst.SportTypeId
                FROM Branches AS b
                INNER JOIN BranchSportTypes AS bst ON bst.BranchId = b.Id;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "SportTypeId",
                table: "Branches",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.DropTable(
                name: "BranchSportTypes");

            migrationBuilder.CreateIndex(
                name: "IX_Branches_SportTypeId",
                table: "Branches",
                column: "SportTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Branches_SportType_SportTypeId",
                table: "Branches",
                column: "SportTypeId",
                principalTable: "SportType",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
