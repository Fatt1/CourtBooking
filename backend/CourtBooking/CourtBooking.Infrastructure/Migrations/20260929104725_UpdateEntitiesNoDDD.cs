using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEntitiesNoDDD : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_SportType_ImageId",
                table: "SportType",
                column: "ImageId");

            migrationBuilder.CreateIndex(
                name: "IX_Services_ImageId",
                table: "Services",
                column: "ImageId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ImageId",
                table: "Reviews",
                column: "ImageId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_PlayerId",
                table: "Reviews",
                column: "PlayerId");

            migrationBuilder.CreateIndex(
                name: "IX_PlayerProfiles_AvatarImageId",
                table: "PlayerProfiles",
                column: "AvatarImageId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_ProofImageId",
                table: "PaymentTransactions",
                column: "ProofImageId");

            migrationBuilder.CreateIndex(
                name: "IX_EventTickets_ProofImageId",
                table: "EventTickets",
                column: "ProofImageId");

            migrationBuilder.CreateIndex(
                name: "IX_CourtOwners_QrImageId",
                table: "CourtOwners",
                column: "QrImageId");

            migrationBuilder.CreateIndex(
                name: "IX_Branches_QrImageId",
                table: "Branches",
                column: "QrImageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Branches_CourtOwners_CourtOwnerId",
                table: "Branches",
                column: "CourtOwnerId",
                principalTable: "CourtOwners",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Branches_Images_QrImageId",
                table: "Branches",
                column: "QrImageId",
                principalTable: "Images",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Branches_SportType_SportTypeId",
                table: "Branches",
                column: "SportTypeId",
                principalTable: "SportType",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_BranchImages_Images_ImageId",
                table: "BranchImages",
                column: "ImageId",
                principalTable: "Images",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CourtOwners_Images_QrImageId",
                table: "CourtOwners",
                column: "QrImageId",
                principalTable: "Images",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CourtOwnerSubscriptions_CourtOwners_CourtOwnerId",
                table: "CourtOwnerSubscriptions",
                column: "CourtOwnerId",
                principalTable: "CourtOwners",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CourtOwnerSubscriptions_ServicePackages_ServicePackageId",
                table: "CourtOwnerSubscriptions",
                column: "ServicePackageId",
                principalTable: "ServicePackages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Courts_CourtTypes_CourtTyped",
                table: "Courts",
                column: "CourtTyped",
                principalTable: "CourtTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CourtTypes_Branches_BranchId",
                table: "CourtTypes",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Orders_OrderId",
                table: "Events",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Events_SportType_SportTypeId",
                table: "Events",
                column: "SportTypeId",
                principalTable: "SportType",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_EventTickets_Images_ProofImageId",
                table: "EventTickets",
                column: "ProofImageId",
                principalTable: "Images",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_EventTickets_Users_PlayerId",
                table: "EventTickets",
                column: "PlayerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FixedOrderConfigCourts_Courts_CourtId",
                table: "FixedOrderConfigCourts",
                column: "CourtId",
                principalTable: "Courts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FixedTimeBlock_CourtTypes_CourtTypeId",
                table: "FixedTimeBlock",
                column: "CourtTypeId",
                principalTable: "CourtTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MatchParticipants_Users_PlayerId",
                table: "MatchParticipants",
                column: "PlayerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Branches_BranchId",
                table: "Orders",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Users_PlayerId",
                table: "Orders",
                column: "PlayerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrdersDetails_Courts_CourtId",
                table: "OrdersDetails",
                column: "CourtId",
                principalTable: "Courts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderServices_Services_ServiceId",
                table: "OrderServices",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentTransactions_Images_ProofImageId",
                table: "PaymentTransactions",
                column: "ProofImageId",
                principalTable: "Images",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PaymentTransactions_Orders_OrderId",
                table: "PaymentTransactions",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PlayerProfiles_Images_AvatarImageId",
                table: "PlayerProfiles",
                column: "AvatarImageId",
                principalTable: "Images",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PriceTables_CourtTypes_CourtTypeId",
                table: "PriceTables",
                column: "CourtTypeId",
                principalTable: "CourtTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RetailOrder_Branches_BranchId",
                table: "RetailOrder",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RetailOrderItems_Services_ServiceId",
                table: "RetailOrderItems",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Branches_BranchId",
                table: "Reviews",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Images_ImageId",
                table: "Reviews",
                column: "ImageId",
                principalTable: "Images",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Orders_OrderId",
                table: "Reviews",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Users_PlayerId",
                table: "Reviews",
                column: "PlayerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ServiceBranches_Branches_BranchId",
                table: "ServiceBranches",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Services_Images_ImageId",
                table: "Services",
                column: "ImageId",
                principalTable: "Images",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Services_ServiceCategories_CategoryId",
                table: "Services",
                column: "CategoryId",
                principalTable: "ServiceCategories",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SocialMatches_Branches_BranchId",
                table: "SocialMatches",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialMatches_Orders_OrderId",
                table: "SocialMatches",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialMatches_SportType_SportTypeId",
                table: "SocialMatches",
                column: "SportTypeId",
                principalTable: "SportType",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialMatches_Users_HostId",
                table: "SocialMatches",
                column: "HostId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SportType_Images_ImageId",
                table: "SportType",
                column: "ImageId",
                principalTable: "Images",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Branches_CourtOwners_CourtOwnerId",
                table: "Branches");

            migrationBuilder.DropForeignKey(
                name: "FK_Branches_Images_QrImageId",
                table: "Branches");

            migrationBuilder.DropForeignKey(
                name: "FK_Branches_SportType_SportTypeId",
                table: "Branches");

            migrationBuilder.DropForeignKey(
                name: "FK_BranchImages_Images_ImageId",
                table: "BranchImages");

            migrationBuilder.DropForeignKey(
                name: "FK_CourtOwners_Images_QrImageId",
                table: "CourtOwners");

            migrationBuilder.DropForeignKey(
                name: "FK_CourtOwnerSubscriptions_CourtOwners_CourtOwnerId",
                table: "CourtOwnerSubscriptions");

            migrationBuilder.DropForeignKey(
                name: "FK_CourtOwnerSubscriptions_ServicePackages_ServicePackageId",
                table: "CourtOwnerSubscriptions");

            migrationBuilder.DropForeignKey(
                name: "FK_Courts_CourtTypes_CourtTyped",
                table: "Courts");

            migrationBuilder.DropForeignKey(
                name: "FK_CourtTypes_Branches_BranchId",
                table: "CourtTypes");

            migrationBuilder.DropForeignKey(
                name: "FK_Events_Orders_OrderId",
                table: "Events");

            migrationBuilder.DropForeignKey(
                name: "FK_Events_SportType_SportTypeId",
                table: "Events");

            migrationBuilder.DropForeignKey(
                name: "FK_EventTickets_Images_ProofImageId",
                table: "EventTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_EventTickets_Users_PlayerId",
                table: "EventTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_FixedOrderConfigCourts_Courts_CourtId",
                table: "FixedOrderConfigCourts");

            migrationBuilder.DropForeignKey(
                name: "FK_FixedTimeBlock_CourtTypes_CourtTypeId",
                table: "FixedTimeBlock");

            migrationBuilder.DropForeignKey(
                name: "FK_MatchParticipants_Users_PlayerId",
                table: "MatchParticipants");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Branches_BranchId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Users_PlayerId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_OrdersDetails_Courts_CourtId",
                table: "OrdersDetails");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderServices_Services_ServiceId",
                table: "OrderServices");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentTransactions_Images_ProofImageId",
                table: "PaymentTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_PaymentTransactions_Orders_OrderId",
                table: "PaymentTransactions");

            migrationBuilder.DropForeignKey(
                name: "FK_PlayerProfiles_Images_AvatarImageId",
                table: "PlayerProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_PriceTables_CourtTypes_CourtTypeId",
                table: "PriceTables");

            migrationBuilder.DropForeignKey(
                name: "FK_RetailOrder_Branches_BranchId",
                table: "RetailOrder");

            migrationBuilder.DropForeignKey(
                name: "FK_RetailOrderItems_Services_ServiceId",
                table: "RetailOrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Branches_BranchId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Images_ImageId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Orders_OrderId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Users_PlayerId",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_ServiceBranches_Branches_BranchId",
                table: "ServiceBranches");

            migrationBuilder.DropForeignKey(
                name: "FK_Services_Images_ImageId",
                table: "Services");

            migrationBuilder.DropForeignKey(
                name: "FK_Services_ServiceCategories_CategoryId",
                table: "Services");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialMatches_Branches_BranchId",
                table: "SocialMatches");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialMatches_Orders_OrderId",
                table: "SocialMatches");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialMatches_SportType_SportTypeId",
                table: "SocialMatches");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialMatches_Users_HostId",
                table: "SocialMatches");

            migrationBuilder.DropForeignKey(
                name: "FK_SportType_Images_ImageId",
                table: "SportType");

            migrationBuilder.DropIndex(
                name: "IX_SportType_ImageId",
                table: "SportType");

            migrationBuilder.DropIndex(
                name: "IX_Services_ImageId",
                table: "Services");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_ImageId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_PlayerId",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_PlayerProfiles_AvatarImageId",
                table: "PlayerProfiles");

            migrationBuilder.DropIndex(
                name: "IX_PaymentTransactions_ProofImageId",
                table: "PaymentTransactions");

            migrationBuilder.DropIndex(
                name: "IX_EventTickets_ProofImageId",
                table: "EventTickets");

            migrationBuilder.DropIndex(
                name: "IX_CourtOwners_QrImageId",
                table: "CourtOwners");

            migrationBuilder.DropIndex(
                name: "IX_Branches_QrImageId",
                table: "Branches");
        }
    }
}
