using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBranchPriceRangeAndReviewAverage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReviewTotal",
                table: "Branches");

            migrationBuilder.AddColumn<decimal>(
                name: "MaxPrice",
                table: "Branches",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "MinPrice",
                table: "Branches",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "ReviewAverage",
                table: "Branches",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxPrice",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "MinPrice",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "ReviewAverage",
                table: "Branches");

            migrationBuilder.AddColumn<int>(
                name: "ReviewTotal",
                table: "Branches",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
