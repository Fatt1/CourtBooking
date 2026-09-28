using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourtBooking.Infrastructure.Migrations;

/// <inheritdoc />
public partial class FirstInit : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Branches",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CourtOwnerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                SportTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                GGMapUrl = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                Province = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                District = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                Street = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                Latitude = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: true),
                Longitude = table.Column<decimal>(type: "decimal(9,6)", precision: 9, scale: 6, nullable: true),
                IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                ReviewTotal = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                OpenTime = table.Column<TimeOnly>(type: "time", nullable: false),
                CloseTime = table.Column<TimeOnly>(type: "time", nullable: false),
                Policy = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                QrImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                AccountNumer = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                AccountName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Branches", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "CourtOwnerSubscriptions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CourtOwnerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ServicePackageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                PricePaid = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CourtOwnerSubscriptions", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Courts",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CourtTyped = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                Status = table.Column<byte>(type: "tinyint", nullable: false, defaultValue: (byte)1),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Courts", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "CourtTypes",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                BranchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                MinutesConfig = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CourtTypes", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Events",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                SportTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Date = table.Column<DateOnly>(type: "date", nullable: false),
                StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                SkillLevelFrom = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                SkillLevelTo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                TicketPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                Slots = table.Column<int>(type: "int", nullable: false),
                AvailableSlot = table.Column<int>(type: "int", nullable: false),
                Status = table.Column<byte>(type: "tinyint", nullable: false, defaultValue: (byte)0, comment: "0:Open, 1:Full, 2:Closed, 3:Cancelled"),
                Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Events", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "FixedTimeBlock",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CourtTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                DaysOfWeekMask = table.Column<int>(type: "int", nullable: false, comment: "Lưu theo kiểu bitwise"),
                StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FixedTimeBlock", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Images",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                StorageProvider = table.Column<byte>(type: "tinyint", nullable: false, comment: "1=Cloudinary, 2=S3, 3=AzureBlob"),
                StorageKey = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false, comment: "public_id/object key - dùng để gọi API xoá file thật trên storage"),
                Status = table.Column<byte>(type: "tinyint", nullable: false, defaultValue: (byte)0),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                AttachedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Images", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Orders",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                OrderCode = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                BranchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                CustomerName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                CustomerPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                Channel = table.Column<byte>(type: "tinyint", nullable: false),
                TotalCourtAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                TotalServiceAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                DiscountAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                Status = table.Column<byte>(type: "tinyint", nullable: false, defaultValue: (byte)0),
                HoldExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                OrderDate = table.Column<DateOnly>(type: "date", nullable: false),
                OrderType = table.Column<byte>(type: "tinyint", nullable: false),
                CancelReason = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                Note = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Orders", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "PaymentTransactions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true, comment: "Nullable: null nếu đây là giao dịch của người chơi tham gia kèo"),
                Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                Type = table.Column<byte>(type: "tinyint", nullable: false, defaultValue: (byte)1, comment: "1: Thanh toán, 2: Hoàn tiền"),
                Method = table.Column<byte>(type: "tinyint", nullable: false),
                ProofImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PaymentTransactions", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "PriceTables",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CourtTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                DefaultPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PriceTables", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "RetailOrder",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                BranchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                DiscountAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 0m),
                OrderDate = table.Column<DateOnly>(type: "date", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RetailOrder", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Reviews",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                BranchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Rating = table.Column<byte>(type: "tinyint", nullable: false),
                Comment = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                ImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Reviews", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Roles",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Roles", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "ServiceCategories",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                Description = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ServiceCategories", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "ServicePackages",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                DurationMonths = table.Column<short>(type: "smallint", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ServicePackages", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Services",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                ImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Services", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "SocialMatches",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                BranchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                SportTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Date = table.Column<DateOnly>(type: "date", nullable: false),
                StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                HostId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                SkillLevel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                MissingPlayers = table.Column<int>(type: "int", nullable: false),
                FeePerPlayer = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                ApprovalMode = table.Column<byte>(type: "tinyint", nullable: false, defaultValue: (byte)0, comment: "0: Tự động duyệt, 1: Chủ kèo duyệt tay"),
                Status = table.Column<byte>(type: "tinyint", nullable: false, defaultValue: (byte)0, comment: "0: Open, 1: Full, 2: Closed, 3: Cancelled"),
                Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SocialMatches", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "SportType",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                ImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SportType", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Users",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                FullName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                Status = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                AccountType = table.Column<int>(type: "int", nullable: false),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                AccessFailedCount = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Users", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "BranchImages",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                BranchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                DisplayOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_BranchImages", x => x.Id);
                table.ForeignKey(
                    name: "FK_BranchImages_Branches_BranchId",
                    column: x => x.BranchId,
                    principalTable: "Branches",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "EventTickets",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Quantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                PaymentMethod = table.Column<byte>(type: "tinyint", nullable: false, comment: "1=Tiền mặt, 2=Chuyển khoản QR"),
                ProofImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: true, comment: "ImageId ảnh chụp màn hình CK - NULL nếu trả tiền mặt tại chỗ"),
                Status = table.Column<byte>(type: "tinyint", nullable: false, defaultValue: (byte)0),
                ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                RefundNote = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true, comment: "Lý do/ghi chú hoàn tiền nếu Status=Refunded"),
                Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_EventTickets", x => x.Id);
                table.ForeignKey(
                    name: "FK_EventTickets_Events_EventId",
                    column: x => x.EventId,
                    principalTable: "Events",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "FixedTimeBlockCourts",
            columns: table => new
            {
                FixedTimeBlockId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CourtId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FixedTimeBlockCourts", x => new { x.FixedTimeBlockId, x.CourtId });
                table.ForeignKey(
                    name: "FK_FixedTimeBlockCourts_Courts_CourtId",
                    column: x => x.CourtId,
                    principalTable: "Courts",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_FixedTimeBlockCourts_FixedTimeBlock_FixedTimeBlockId",
                    column: x => x.FixedTimeBlockId,
                    principalTable: "FixedTimeBlock",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "FixedOrderConfigs",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                DaysOfWeekMask = table.Column<int>(type: "int", nullable: false),
                StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                ExceptionDates = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FixedOrderConfigs", x => x.Id);
                table.ForeignKey(
                    name: "FK_FixedOrderConfigs_Orders_OrderId",
                    column: x => x.OrderId,
                    principalTable: "Orders",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "OrdersDetails",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CourtId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                Date = table.Column<DateOnly>(type: "date", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OrdersDetails", x => x.Id);
                table.ForeignKey(
                    name: "FK_OrdersDetails_Orders_OrderId",
                    column: x => x.OrderId,
                    principalTable: "Orders",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "OrderServices",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                OrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ServiceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Quantity = table.Column<int>(type: "int", nullable: false),
                UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OrderServices", x => x.Id);
                table.ForeignKey(
                    name: "FK_OrderServices_Orders_OrderId",
                    column: x => x.OrderId,
                    principalTable: "Orders",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "PriceTableRules",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                PriceTableId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                StartDate = table.Column<DateOnly>(type: "date", nullable: true),
                EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                DayOfWeekFrom = table.Column<byte>(type: "tinyint", nullable: false),
                DayOfWeekTo = table.Column<byte>(type: "tinyint", nullable: false),
                StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                FixedCustomerPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                WalkInCustomerPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PriceTableRules", x => x.Id);
                table.ForeignKey(
                    name: "FK_PriceTableRules_PriceTables_PriceTableId",
                    column: x => x.PriceTableId,
                    principalTable: "PriceTables",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "RetailOrderItems",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                RetailOrderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ServiceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Quantity = table.Column<int>(type: "int", nullable: false),
                UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RetailOrderItems", x => x.Id);
                table.ForeignKey(
                    name: "FK_RetailOrderItems_RetailOrder_RetailOrderId",
                    column: x => x.RetailOrderId,
                    principalTable: "RetailOrder",
                    principalColumn: "Id");
            });

        migrationBuilder.CreateTable(
            name: "AspNetRoleClaims",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                table.ForeignKey(
                    name: "FK_AspNetRoleClaims_Roles_RoleId",
                    column: x => x.RoleId,
                    principalTable: "Roles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ServiceBranches",
            columns: table => new
            {
                ServiceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                BranchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ServiceBranches", x => new { x.ServiceId, x.BranchId });
                table.ForeignKey(
                    name: "FK_ServiceBranches_Services_ServiceId",
                    column: x => x.ServiceId,
                    principalTable: "Services",
                    principalColumn: "Id");
            });

        migrationBuilder.CreateTable(
            name: "MatchParticipants",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                MatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                PlayerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Status = table.Column<byte>(type: "tinyint", nullable: false, defaultValue: (byte)0, comment: "0: PendingApproval, 1: PendingPayment, 2: Confirmed, 3: Rejected, 4: Cancelled, 5: Expired"),
                HoldExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_MatchParticipants", x => x.Id);
                table.ForeignKey(
                    name: "FK_MatchParticipants_SocialMatches_MatchId",
                    column: x => x.MatchId,
                    principalTable: "SocialMatches",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "AspNetUserClaims",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                table.ForeignKey(
                    name: "FK_AspNetUserClaims_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "AspNetUserLogins",
            columns: table => new
            {
                LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                table.ForeignKey(
                    name: "FK_AspNetUserLogins_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "AspNetUserRoles",
            columns: table => new
            {
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                table.ForeignKey(
                    name: "FK_AspNetUserRoles_Roles_RoleId",
                    column: x => x.RoleId,
                    principalTable: "Roles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_AspNetUserRoles_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "AspNetUserTokens",
            columns: table => new
            {
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                table.ForeignKey(
                    name: "FK_AspNetUserTokens_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "CourtOwners",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                BusinessName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                TaxCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                MustChangePwd = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                QrImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CourtOwners", x => x.Id);
                table.ForeignKey(
                    name: "FK_CourtOwners_Users_Id",
                    column: x => x.Id,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "PlayerProfiles",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                AvatarImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                DateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                Gender = table.Column<int>(type: "int", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PlayerProfiles", x => x.Id);
                table.ForeignKey(
                    name: "FK_PlayerProfiles_Users_Id",
                    column: x => x.Id,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "RefreshTokens",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Token = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                table.ForeignKey(
                    name: "FK_RefreshTokens_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "FixedOrderConfigCourts",
            columns: table => new
            {
                FixedOrderConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CourtId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FixedOrderConfigCourts", x => new { x.FixedOrderConfigId, x.CourtId });
                table.ForeignKey(
                    name: "FK_FixedOrderConfigCourts_FixedOrderConfigs_FixedOrderConfigId",
                    column: x => x.FixedOrderConfigId,
                    principalTable: "FixedOrderConfigs",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_AspNetRoleClaims_RoleId",
            table: "AspNetRoleClaims",
            column: "RoleId");

        migrationBuilder.CreateIndex(
            name: "IX_AspNetUserClaims_UserId",
            table: "AspNetUserClaims",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_AspNetUserLogins_UserId",
            table: "AspNetUserLogins",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_AspNetUserRoles_RoleId",
            table: "AspNetUserRoles",
            column: "RoleId");

        migrationBuilder.CreateIndex(
            name: "IX_Branches_CourtOwnerId",
            table: "Branches",
            column: "CourtOwnerId");

        migrationBuilder.CreateIndex(
            name: "IX_Branches_SportTypeId",
            table: "Branches",
            column: "SportTypeId");

        migrationBuilder.CreateIndex(
            name: "IX_BranchImages_BranchId",
            table: "BranchImages",
            column: "BranchId");

        migrationBuilder.CreateIndex(
            name: "IX_BranchImages_ImageId",
            table: "BranchImages",
            column: "ImageId");

        migrationBuilder.CreateIndex(
            name: "IX_CourtOwnerSubscriptions_CourtOwnerId",
            table: "CourtOwnerSubscriptions",
            column: "CourtOwnerId");

        migrationBuilder.CreateIndex(
            name: "IX_CourtOwnerSubscriptions_ServicePackageId",
            table: "CourtOwnerSubscriptions",
            column: "ServicePackageId");

        migrationBuilder.CreateIndex(
            name: "IX_Courts_CourtTyped",
            table: "Courts",
            column: "CourtTyped");

        migrationBuilder.CreateIndex(
            name: "IX_CourtTypes_BranchId",
            table: "CourtTypes",
            column: "BranchId");

        migrationBuilder.CreateIndex(
            name: "IX_Events_OrderId",
            table: "Events",
            column: "OrderId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Events_SportTypeId",
            table: "Events",
            column: "SportTypeId");

        migrationBuilder.CreateIndex(
            name: "IX_EventTickets_EventId",
            table: "EventTickets",
            column: "EventId");

        migrationBuilder.CreateIndex(
            name: "IX_EventTickets_PlayerId",
            table: "EventTickets",
            column: "PlayerId");

        migrationBuilder.CreateIndex(
            name: "IX_FixedOrderConfigCourts_CourtId",
            table: "FixedOrderConfigCourts",
            column: "CourtId");

        migrationBuilder.CreateIndex(
            name: "IX_FixedOrderConfigs_OrderId",
            table: "FixedOrderConfigs",
            column: "OrderId");

        migrationBuilder.CreateIndex(
            name: "IX_FixedTimeBlock_CourtTypeId",
            table: "FixedTimeBlock",
            column: "CourtTypeId");

        migrationBuilder.CreateIndex(
            name: "IX_FixedTimeBlockCourts_CourtId",
            table: "FixedTimeBlockCourts",
            column: "CourtId");

        migrationBuilder.CreateIndex(
            name: "IX_MatchParticipants_PlayerId",
            table: "MatchParticipants",
            column: "PlayerId");

        migrationBuilder.CreateIndex(
            name: "UQ_MatchParticipants_MatchId_PlayerId",
            table: "MatchParticipants",
            columns: new[] { "MatchId", "PlayerId" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Orders_BranchId",
            table: "Orders",
            column: "BranchId");

        migrationBuilder.CreateIndex(
            name: "IX_Orders_HoldExpiresAt",
            table: "Orders",
            column: "HoldExpiresAt",
            filter: "[Status] = 0");

        migrationBuilder.CreateIndex(
            name: "IX_Orders_PlayerId",
            table: "Orders",
            column: "PlayerId");

        migrationBuilder.CreateIndex(
            name: "IX_OrdersDetails_CourtId_Date_StartTime",
            table: "OrdersDetails",
            columns: new[] { "CourtId", "Date", "StartTime" });

        migrationBuilder.CreateIndex(
            name: "IX_OrdersDetails_OrderId",
            table: "OrdersDetails",
            column: "OrderId");

        migrationBuilder.CreateIndex(
            name: "IX_OrderServices_OrderId",
            table: "OrderServices",
            column: "OrderId");

        migrationBuilder.CreateIndex(
            name: "IX_OrderServices_ServiceId",
            table: "OrderServices",
            column: "ServiceId");

        migrationBuilder.CreateIndex(
            name: "IX_PaymentTransactions_OrderId",
            table: "PaymentTransactions",
            column: "OrderId");

        migrationBuilder.CreateIndex(
            name: "IX_PriceTableRules_PriceTableId",
            table: "PriceTableRules",
            column: "PriceTableId");

        migrationBuilder.CreateIndex(
            name: "IX_PriceTables_CourtTypeId",
            table: "PriceTables",
            column: "CourtTypeId");

        migrationBuilder.CreateIndex(
            name: "IX_RefreshTokens_Token",
            table: "RefreshTokens",
            column: "Token",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_RefreshTokens_UserId",
            table: "RefreshTokens",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_RetailOrder_BranchId",
            table: "RetailOrder",
            column: "BranchId");

        migrationBuilder.CreateIndex(
            name: "IX_RetailOrderItems_RetailOrderId",
            table: "RetailOrderItems",
            column: "RetailOrderId");

        migrationBuilder.CreateIndex(
            name: "IX_RetailOrderItems_ServiceId",
            table: "RetailOrderItems",
            column: "ServiceId");

        migrationBuilder.CreateIndex(
            name: "IX_Reviews_BranchId",
            table: "Reviews",
            column: "BranchId");

        migrationBuilder.CreateIndex(
            name: "IX_Reviews_OrderId",
            table: "Reviews",
            column: "OrderId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "RoleNameIndex",
            table: "Roles",
            column: "NormalizedName",
            unique: true,
            filter: "[NormalizedName] IS NOT NULL");

        migrationBuilder.CreateIndex(
            name: "IX_ServiceBranches_BranchId",
            table: "ServiceBranches",
            column: "BranchId");

        migrationBuilder.CreateIndex(
            name: "IX_ServiceCategories_Name",
            table: "ServiceCategories",
            column: "Name",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Services_CategoryId",
            table: "Services",
            column: "CategoryId");

        migrationBuilder.CreateIndex(
            name: "IX_SocialMatches_BranchId",
            table: "SocialMatches",
            column: "BranchId");

        migrationBuilder.CreateIndex(
            name: "IX_SocialMatches_HostId",
            table: "SocialMatches",
            column: "HostId");

        migrationBuilder.CreateIndex(
            name: "IX_SocialMatches_OrderId",
            table: "SocialMatches",
            column: "OrderId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_SocialMatches_SportTypeId",
            table: "SocialMatches",
            column: "SportTypeId");

        migrationBuilder.CreateIndex(
            name: "EmailIndex",
            table: "Users",
            column: "NormalizedEmail");

        migrationBuilder.CreateIndex(
            name: "UserNameIndex",
            table: "Users",
            column: "NormalizedUserName",
            unique: true,
            filter: "[NormalizedUserName] IS NOT NULL");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "AspNetRoleClaims");

        migrationBuilder.DropTable(
            name: "AspNetUserClaims");

        migrationBuilder.DropTable(
            name: "AspNetUserLogins");

        migrationBuilder.DropTable(
            name: "AspNetUserRoles");

        migrationBuilder.DropTable(
            name: "AspNetUserTokens");

        migrationBuilder.DropTable(
            name: "BranchImages");

        migrationBuilder.DropTable(
            name: "CourtOwners");

        migrationBuilder.DropTable(
            name: "CourtOwnerSubscriptions");

        migrationBuilder.DropTable(
            name: "CourtTypes");

        migrationBuilder.DropTable(
            name: "EventTickets");

        migrationBuilder.DropTable(
            name: "FixedOrderConfigCourts");

        migrationBuilder.DropTable(
            name: "FixedTimeBlockCourts");

        migrationBuilder.DropTable(
            name: "Images");

        migrationBuilder.DropTable(
            name: "MatchParticipants");

        migrationBuilder.DropTable(
            name: "OrdersDetails");

        migrationBuilder.DropTable(
            name: "OrderServices");

        migrationBuilder.DropTable(
            name: "PaymentTransactions");

        migrationBuilder.DropTable(
            name: "PlayerProfiles");

        migrationBuilder.DropTable(
            name: "PriceTableRules");

        migrationBuilder.DropTable(
            name: "RefreshTokens");

        migrationBuilder.DropTable(
            name: "RetailOrderItems");

        migrationBuilder.DropTable(
            name: "Reviews");

        migrationBuilder.DropTable(
            name: "ServiceBranches");

        migrationBuilder.DropTable(
            name: "ServiceCategories");

        migrationBuilder.DropTable(
            name: "ServicePackages");

        migrationBuilder.DropTable(
            name: "SportType");

        migrationBuilder.DropTable(
            name: "Roles");

        migrationBuilder.DropTable(
            name: "Branches");

        migrationBuilder.DropTable(
            name: "Events");

        migrationBuilder.DropTable(
            name: "FixedOrderConfigs");

        migrationBuilder.DropTable(
            name: "Courts");

        migrationBuilder.DropTable(
            name: "FixedTimeBlock");

        migrationBuilder.DropTable(
            name: "SocialMatches");

        migrationBuilder.DropTable(
            name: "PriceTables");

        migrationBuilder.DropTable(
            name: "Users");

        migrationBuilder.DropTable(
            name: "RetailOrder");

        migrationBuilder.DropTable(
            name: "Services");

        migrationBuilder.DropTable(
            name: "Orders");
    }
}
