                                                                                                                                                                                                                    using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Infrastructure.Migrations;

public partial class AddRetailPaymentAndRequestId : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(name: "PaymentMethod", table: "RetailOrder", type: "int", nullable: true);
        migrationBuilder.AddColumn<Guid>(name: "ClientRequestId", table: "RetailOrder", type: "uniqueidentifier", nullable: true);
        migrationBuilder.CreateIndex(name: "IX_RetailOrder_BranchId_ClientRequestId", table: "RetailOrder",
            columns: new[] { "BranchId", "ClientRequestId" }, unique: true, filter: "[ClientRequestId] IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_RetailOrder_BranchId_ClientRequestId", table: "RetailOrder");
        migrationBuilder.DropColumn(name: "PaymentMethod", table: "RetailOrder");
        migrationBuilder.DropColumn(name: "ClientRequestId", table: "RetailOrder");
    }
}
