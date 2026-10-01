using CourtBooking.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Infrastructure.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260930153022_AddServiceCategoryOwnership")]
public partial class AddServiceCategoryOwnership : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_ServiceCategories_Name",
            table: "ServiceCategories");

        migrationBuilder.AddColumn<Guid>(
            name: "CourtOwnerId",
            table: "ServiceCategories",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.Sql(
            """
            UPDATE sc
            SET sc.CourtOwnerId = COALESCE(
                (SELECT TOP (1) b.CourtOwnerId
                 FROM Services s
                 INNER JOIN ServiceBranches sb ON sb.ServiceId = s.Id
                 INNER JOIN Branches b ON b.Id = sb.BranchId
                 WHERE s.CategoryId = sc.Id),
                (SELECT TOP (1) Id FROM CourtOwners))
            FROM ServiceCategories sc;
            """);

        migrationBuilder.AlterColumn<Guid>(
            name: "CourtOwnerId",
            table: "ServiceCategories",
            type: "uniqueidentifier",
            nullable: false,
            oldClrType: typeof(Guid),
            oldType: "uniqueidentifier",
            oldNullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_ServiceCategories_CourtOwnerId_Name",
            table: "ServiceCategories",
            columns: new[] { "CourtOwnerId", "Name" },
            unique: true);

        migrationBuilder.AddForeignKey(
            name: "FK_ServiceCategories_CourtOwners_CourtOwnerId",
            table: "ServiceCategories",
            column: "CourtOwnerId",
            principalTable: "CourtOwners",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_ServiceCategories_CourtOwners_CourtOwnerId",
            table: "ServiceCategories");
        migrationBuilder.DropIndex(
            name: "IX_ServiceCategories_CourtOwnerId_Name",
            table: "ServiceCategories");
        migrationBuilder.DropColumn(
            name: "CourtOwnerId",
            table: "ServiceCategories");
        migrationBuilder.CreateIndex(
            name: "IX_ServiceCategories_Name",
            table: "ServiceCategories",
            column: "Name",
            unique: true);
    }
}
