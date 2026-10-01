using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRetailOrderManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "RetailOrder",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerName",
                table: "RetailOrder",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrderCode",
                table: "RetailOrder",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaymentMethod",
                table: "RetailOrder",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.Sql(
                """
                UPDATE ro
                SET ro.CreatedByUserId = b.CourtOwnerId,
                    ro.OrderCode = CONCAT('POS-LEGACY-', REPLACE(CONVERT(varchar(36), ro.Id), '-', ''))
                FROM RetailOrder ro
                INNER JOIN Branches b ON b.Id = ro.BranchId;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatedByUserId",
                table: "RetailOrder",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "OrderCode",
                table: "RetailOrder",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RetailOrder_CreatedByUserId",
                table: "RetailOrder",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "UX_RetailOrder_OrderCode",
                table: "RetailOrder",
                column: "OrderCode",
                unique: true);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RetailOrder_CreatedByUserId",
                table: "RetailOrder");

            migrationBuilder.DropIndex(
                name: "UX_RetailOrder_OrderCode",
                table: "RetailOrder");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "RetailOrder");

            migrationBuilder.DropColumn(
                name: "CustomerName",
                table: "RetailOrder");

            migrationBuilder.DropColumn(
                name: "OrderCode",
                table: "RetailOrder");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "RetailOrder");

        }
    }
}
