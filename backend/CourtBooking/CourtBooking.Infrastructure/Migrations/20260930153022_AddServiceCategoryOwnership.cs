using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceCategoryOwnership : Migration
    {
        /// <inheritdoc />
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
                UPDATE category
                SET CourtOwnerId = ownerMapping.CourtOwnerId
                FROM ServiceCategories AS category
                CROSS APPLY (
                    SELECT TOP (1) branch.CourtOwnerId
                    FROM Services AS service
                    INNER JOIN ServiceBranches AS serviceBranch ON serviceBranch.ServiceId = service.Id
                    INNER JOIN Branches AS branch ON branch.Id = serviceBranch.BranchId
                    WHERE service.CategoryId = category.Id
                    ORDER BY branch.CourtOwnerId
                ) AS ownerMapping;

                UPDATE ServiceCategories
                SET CourtOwnerId = (SELECT TOP (1) Id FROM CourtOwners ORDER BY Id)
                WHERE CourtOwnerId IS NULL;

                IF EXISTS (SELECT 1 FROM ServiceCategories WHERE CourtOwnerId IS NULL)
                    THROW 50001, 'Cannot assign ServiceCategories because no CourtOwner exists.', 1;
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

        /// <inheritdoc />
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
}
