using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EmbedServicePackageInCourtOwner : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "SocialMatches");

            migrationBuilder.AddColumn<DateOnly>(
                name: "PackageEndDate",
                table: "CourtOwners",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "PackageStartDate",
                table: "CourtOwners",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ServicePackageId",
                table: "CourtOwners",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourtOwners_ServicePackageId",
                table: "CourtOwners",
                column: "ServicePackageId");

            migrationBuilder.AddForeignKey(
                name: "FK_CourtOwners_ServicePackages_ServicePackageId",
                table: "CourtOwners",
                column: "ServicePackageId",
                principalTable: "ServicePackages",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourtOwners_ServicePackages_ServicePackageId",
                table: "CourtOwners");

            migrationBuilder.DropIndex(
                name: "IX_CourtOwners_ServicePackageId",
                table: "CourtOwners");

            migrationBuilder.DropColumn(
                name: "PackageEndDate",
                table: "CourtOwners");

            migrationBuilder.DropColumn(
                name: "PackageStartDate",
                table: "CourtOwners");

            migrationBuilder.DropColumn(
                name: "ServicePackageId",
                table: "CourtOwners");

            migrationBuilder.AddColumn<byte>(
                name: "Status",
                table: "SocialMatches",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0,
                comment: "0: Open, 1: Full, 2: Closed, 3: Cancelled");
        }
    }
}
