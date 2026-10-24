using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemovePlayerProfileAvatarImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlayerProfiles_Images_AvatarImageId",
                table: "PlayerProfiles");

            migrationBuilder.DropIndex(
                name: "IX_PlayerProfiles_AvatarImageId",
                table: "PlayerProfiles");

            migrationBuilder.DropColumn(
                name: "AvatarImageId",
                table: "PlayerProfiles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AvatarImageId",
                table: "PlayerProfiles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlayerProfiles_AvatarImageId",
                table: "PlayerProfiles",
                column: "AvatarImageId");

            migrationBuilder.AddForeignKey(
                name: "FK_PlayerProfiles_Images_AvatarImageId",
                table: "PlayerProfiles",
                column: "AvatarImageId",
                principalTable: "Images",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
