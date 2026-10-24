using CourtBooking.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20261024074500_AddOrderCodeToRetailOrder")]
    public partial class AddOrderCodeToRetailOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OrderCode",
                table: "RetailOrder",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.Sql("UPDATE [RetailOrder] SET [OrderCode] = 'HD-' + UPPER(SUBSTRING(REPLACE(CAST([Id] AS nvarchar(36)), '-', ''), 1, 8)) WHERE [OrderCode] IS NULL;");

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
                name: "IX_RetailOrder_OrderCode",
                table: "RetailOrder",
                column: "OrderCode");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RetailOrder_OrderCode",
                table: "RetailOrder");

            migrationBuilder.DropColumn(
                name: "OrderCode",
                table: "RetailOrder");
        }
    }
}
