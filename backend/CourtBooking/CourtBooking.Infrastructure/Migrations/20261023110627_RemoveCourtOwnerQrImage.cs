using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCourtOwnerQrImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourtOwners_Images_QrImageId",
                table: "CourtOwners");

            migrationBuilder.DropIndex(
                name: "IX_CourtOwners_QrImageId",
                table: "CourtOwners");

            migrationBuilder.DropColumn(
                name: "QrImageId",
                table: "CourtOwners");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "QrImageId",
                table: "CourtOwners",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_CourtOwners_QrImageId",
                table: "CourtOwners",
                column: "QrImageId");

            migrationBuilder.AddForeignKey(
                name: "FK_CourtOwners_Images_QrImageId",
                table: "CourtOwners",
                column: "QrImageId",
                principalTable: "Images",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
