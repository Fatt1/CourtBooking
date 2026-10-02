using System.Diagnostics.CodeAnalysis;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Events;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Entities.Matches;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Payments;
using CourtBooking.Domain.Entities.Reviews;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.Domain.Entities.Subscriptions;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Infrastructure.Database;

public static class DatabaseSeeder
{
    // ── Default User IDs ──
    public static readonly Guid AdminUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid CourtOwnerUserId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    public static readonly Guid Player1UserId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    public static readonly Guid Player2UserId = Guid.Parse("55555555-5555-5555-5555-555555555555");

    // ── Default Role IDs ──
    public static readonly Guid AdminRoleId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    public static readonly Guid CourtOwnerRoleId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    public static readonly Guid PlayerRoleId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

    [SuppressMessage("Minor Code Smell", "S1075:URIs should not be hardcoded", Justification = "Sample seeded URLs for mock branches")]
    public static async Task SeedAsync(ApplicationDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        // 0. Check if database has already been seeded
        if (await context.Roles.AnyAsync(cancellationToken) || await context.Users.IgnoreQueryFilters().AnyAsync(cancellationToken))
        {
            logger.LogInformation("Database already contains seed data. Skipping seeding.");
            return;
        }

        logger.LogInformation("Starting database seeding for all entities...");

        // ──────────────────────────────────────────────────────────────
        // 1. Images
        // ──────────────────────────────────────────────────────────────
        static Image CreateImage(string key) => new()
        {
            Id = Guid.NewGuid(),
            StorageProvider = StorageProvider.S3,
            StorageKey = key,
            Status = ImageStatus.Attached,
            CreatedAt = DateTime.UtcNow,
            AttachedAt = DateTime.UtcNow
        };

        var adminAvatar = CreateImage("images/avatars/admin.webp");
        var ownerAvatar = CreateImage("images/avatars/owner.webp");
        var player1Avatar = CreateImage("images/avatars/player1.webp");
        var player2Avatar = CreateImage("images/avatars/player2.webp");
        var ownerQrImage = CreateImage("images/qr/owner-payment.webp");

        var badmintonIcon = CreateImage("images/sports/badminton.webp");
        var pickleballIcon = CreateImage("images/sports/pickleball.webp");
        var futsalIcon = CreateImage("images/sports/futsal.webp");

        var branch1Img1 = CreateImage("images/branches/saigon-star-1.webp");
        var branch1Img2 = CreateImage("images/branches/saigon-star-2.webp");
        var branch1Img3 = CreateImage("images/branches/saigon-star-3.webp");
        var branch2Img1 = CreateImage("images/branches/phunhuan-arena-1.webp");

        var waterImg = CreateImage("images/services/aquafina.webp");
        var reviveImg = CreateImage("images/services/revive.webp");
        var shuttlecockImg = CreateImage("images/services/shuttlecock.webp");
        var racketImg = CreateImage("images/services/racket.webp");

        var paymentProofImg = CreateImage("images/payments/proof-ord-001.webp");
        var reviewImg = CreateImage("images/reviews/review-branch1.webp");

        var allImages = new[]
        {
            adminAvatar, ownerAvatar, player1Avatar, player2Avatar, ownerQrImage,
            badmintonIcon, pickleballIcon, futsalIcon,
            branch1Img1, branch1Img2, branch1Img3, branch2Img1,
            waterImg, reviveImg, shuttlecockImg, racketImg,
            paymentProofImg, reviewImg
        };

        await context.Images.AddRangeAsync(allImages, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 2. Roles
        // ──────────────────────────────────────────────────────────────
        var roleAdmin = new ApplicationRole
        {
            Id = AdminRoleId,
            Name = "Admin",
            NormalizedName = "ADMIN",
            Description = "Quản trị viên toàn hệ thống"
        };
        var roleOwner = new ApplicationRole
        {
            Id = CourtOwnerRoleId,
            Name = "CourtOwner",
            NormalizedName = "COURTOWNER",
            Description = "Chủ cơ sở thể thao / quản lý sân"
        };
        var rolePlayer = new ApplicationRole
        {
            Id = PlayerRoleId,
            Name = "Player",
            NormalizedName = "PLAYER",
            Description = "Khách hàng / Người chơi"
        };

        await context.Roles.AddRangeAsync([roleAdmin, roleOwner, rolePlayer], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 3. Users & UserRoles
        // ──────────────────────────────────────────────────────────────
        var hasher = new PasswordHasher<ApplicationUser>();

        var userAdmin = new ApplicationUser
        {
            Id = AdminUserId,
            FullName = "Hệ Thống Admin",
            Email = "admin@courtbooking.com",
            NormalizedEmail = "ADMIN@COURTBOOKING.COM",
            UserName = "admin@courtbooking.com",
            NormalizedUserName = "ADMIN@COURTBOOKING.COM",
            PhoneNumber = "0901000001",
            AccountType = AccountType.Admin,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        userAdmin.PasswordHash = hasher.HashPassword(userAdmin, "Admin@123456");
        userAdmin.SecurityStamp = Guid.NewGuid().ToString();

        var userOwner = new ApplicationUser
        {
            Id = CourtOwnerUserId,
            FullName = "Nguyễn Văn Chủ Sân",
            Email = "owner@courtbooking.com",
            NormalizedEmail = "OWNER@COURTBOOKING.COM",
            UserName = "owner@courtbooking.com",
            NormalizedUserName = "OWNER@COURTBOOKING.COM",
            PhoneNumber = "0912000002",
            AccountType = AccountType.CourtOwner,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        userOwner.PasswordHash = hasher.HashPassword(userOwner, "Owner@123456");
        userOwner.SecurityStamp = Guid.NewGuid().ToString();

        var userPlayer1 = new ApplicationUser
        {
            Id = Player1UserId,
            FullName = "Lê Văn Cầu Thủ",
            Email = "player1@courtbooking.com",
            NormalizedEmail = "PLAYER1@COURTBOOKING.COM",
            UserName = "player1@courtbooking.com",
            NormalizedUserName = "PLAYER1@COURTBOOKING.COM",
            PhoneNumber = "0934000004",
            AccountType = AccountType.Player,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        userPlayer1.PasswordHash = hasher.HashPassword(userPlayer1, "Player@123456");
        userPlayer1.SecurityStamp = Guid.NewGuid().ToString();

        var userPlayer2 = new ApplicationUser
        {
            Id = Player2UserId,
            FullName = "Phạm Thị Khách Hàng",
            Email = "player2@courtbooking.com",
            NormalizedEmail = "PLAYER2@COURTBOOKING.COM",
            UserName = "player2@courtbooking.com",
            NormalizedUserName = "PLAYER2@COURTBOOKING.COM",
            PhoneNumber = "0945000005",
            AccountType = AccountType.Player,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        userPlayer2.PasswordHash = hasher.HashPassword(userPlayer2, "Player@123456");
        userPlayer2.SecurityStamp = Guid.NewGuid().ToString();

        await context.Users.AddRangeAsync([userAdmin, userOwner, userPlayer1, userPlayer2], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var userRoles = new[]
        {
            new IdentityUserRole<Guid> { UserId = userAdmin.Id, RoleId = roleAdmin.Id },
            new IdentityUserRole<Guid> { UserId = userOwner.Id, RoleId = roleOwner.Id },
            new IdentityUserRole<Guid> { UserId = userPlayer1.Id, RoleId = rolePlayer.Id },
            new IdentityUserRole<Guid> { UserId = userPlayer2.Id, RoleId = rolePlayer.Id }
        };
        await context.Set<IdentityUserRole<Guid>>().AddRangeAsync(userRoles, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 4. Profiles & Refresh Tokens
        // ──────────────────────────────────────────────────────────────
        var courtOwnerProfile = new CourtOwner
        {
            Id = userOwner.Id,
            BusinessName = "CLB Cầu Lông & Pickleball Sài Gòn Star",
            QrImageId = ownerQrImage.Id,
            TaxCode = "0312345678",
            MustChangePwd = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var playerProfile1 = new PlayerProfile
        {
            Id = userPlayer1.Id,
            Gender = Gender.Male,
            DateOfBirth = new DateOnly(1995, 5, 20),
            AvatarImageId = player1Avatar.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var playerProfile2 = new PlayerProfile
        {
            Id = userPlayer2.Id,
            Gender = Gender.Female,
            DateOfBirth = new DateOnly(1998, 10, 15),
            AvatarImageId = player2Avatar.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userPlayer1.Id,
            Token = "seed-refresh-token-player1-secure-jwt",
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow
        };

        await context.CourtOwners.AddAsync(courtOwnerProfile, cancellationToken);
        await context.PlayerProfiles.AddRangeAsync([playerProfile1, playerProfile2], cancellationToken);
        await context.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 5. Subscriptions (ServicePackages & CourtOwnerSubscription)
        // ──────────────────────────────────────────────────────────────
        var pkgBasic = new ServicePackage
        {
            Id = Guid.NewGuid(),
            Name = "Gói Cơ Bản (1 Tháng)",
            Price = 299000m,
            Description = "Quản lý tối đa 4 sân, tính năng đặt sân cơ bản.",
            DurationMonths = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var pkgStandard = new ServicePackage
        {
            Id = Guid.NewGuid(),
            Name = "Gói Tiêu Chuẩn (6 Tháng)",
            Price = 1499000m,
            Description = "Quản lý tối đa 10 sân, đầy đủ bán lẻ và thống kê.",
            DurationMonths = 6,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var pkgEnterprise = new ServicePackage
        {
            Id = Guid.NewGuid(),
            Name = "Gói Doanh Nghiệp (12 Tháng)",
            Price = 2699000m,
            Description = "Không giới hạn sân, ưu tiên hỗ trợ 24/7 và giải đấu.",
            DurationMonths = 12,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await context.ServicePackages.AddRangeAsync([pkgBasic, pkgStandard, pkgEnterprise], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var ownerSub = new CourtOwnerSubscription
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = userOwner.Id,
            ServicePackageId = pkgEnterprise.Id,
            PricePaid = pkgEnterprise.Price,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(335)),
            CreatedAt = DateTime.UtcNow
        };

        await context.CourtOwnerSubscriptions.AddAsync(ownerSub, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 6. SportTypes
        // ──────────────────────────────────────────────────────────────
        var sportBadminton = new SportType
        {
            Id = Guid.NewGuid(),
            Name = "Cầu lông",
            ImageId = badmintonIcon.Id,
            IsActive = true
        };

        var sportPickleball = new SportType
        {
            Id = Guid.NewGuid(),
            Name = "Pickleball",
            ImageId = pickleballIcon.Id,
            IsActive = true
        };

        var sportFutsal = new SportType
        {
            Id = Guid.NewGuid(),
            Name = "Bóng đá mini",
            ImageId = futsalIcon.Id,
            IsActive = true
        };

        await context.SportTypes.AddRangeAsync([sportBadminton, sportPickleball, sportFutsal], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 7. Branches & BranchImages
        // ──────────────────────────────────────────────────────────────
        var branch1 = new Branch
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = userOwner.Id,
            SportTypeId = sportBadminton.Id,
            Name = "CLB Cầu Lông & Pickleball Sài Gòn Star - Chi Nhánh 1",
            GgMapUrl = "https://maps.google.com/search?q=saigon-star-branch-1",
            Province = "Hồ Chí Minh",
            District = "Quận 7",
            Street = "123 Nguyễn Thị Thập, Phường Tân Phú",
            OpenTime = new TimeOnly(5, 0),
            CloseTime = new TimeOnly(23, 0),
            QrImageId = ownerQrImage.Id,
            AccountNumber = "1903678912345",
            AccountName = "NGUYEN VAN CHU SAN",
            IsActive = true,
            ReviewTotal = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var branch2 = new Branch
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = userOwner.Id,
            SportTypeId = sportPickleball.Id,
            Name = "CLB Pickleball Phú Nhuận Arena - Chi Nhánh 2",
            GgMapUrl = "https://maps.google.com/search?q=phunhuan-arena-branch-2",
            Province = "Hồ Chí Minh",
            District = "Phú Nhuận",
            Street = "45 Phan Xích Long, Phường 2",
            OpenTime = new TimeOnly(6, 0),
            CloseTime = new TimeOnly(22, 0),
            QrImageId = ownerQrImage.Id,
            AccountNumber = "1903678912345",
            AccountName = "NGUYEN VAN CHU SAN",
            IsActive = true,
            ReviewTotal = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await context.Branches.AddRangeAsync([branch1, branch2], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var branchImages = new[]
        {
            new BranchImage { Id = Guid.NewGuid(), BranchId = branch1.Id, ImageId = branch1Img1.Id, DisplayOrder = 0 },
            new BranchImage { Id = Guid.NewGuid(), BranchId = branch1.Id, ImageId = branch1Img2.Id, DisplayOrder = 1 },
            new BranchImage { Id = Guid.NewGuid(), BranchId = branch1.Id, ImageId = branch1Img3.Id, DisplayOrder = 2 },
            new BranchImage { Id = Guid.NewGuid(), BranchId = branch2.Id, ImageId = branch2Img1.Id, DisplayOrder = 0 }
        };
        await context.BranchImages.AddRangeAsync(branchImages, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 8. CourtTypes & Courts
        // ──────────────────────────────────────────────────────────────
        var courtType1 = new CourtType
        {
            Id = Guid.NewGuid(),
            BranchId = branch1.Id,
            Name = "Sân Cầu Lông Tiêu Chuẩn Thảm PVC",
            MinutesConfig = 60
        };

        var courtType2 = new CourtType
        {
            Id = Guid.NewGuid(),
            BranchId = branch1.Id,
            Name = "Sân Cầu Lông VIP Thi Đấu",
            MinutesConfig = 60
        };

        var courtType3 = new CourtType
        {
            Id = Guid.NewGuid(),
            BranchId = branch2.Id,
            Name = "Sân Pickleball Ngoài Trời",
            MinutesConfig = 60
        };

        await context.CourtTypes.AddRangeAsync([courtType1, courtType2, courtType3], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var court1 = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType1.Id, Name = "Sân 1", Status = CourtStatus.Available, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var court2 = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType1.Id, Name = "Sân 2", Status = CourtStatus.Available, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var court3 = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType1.Id, Name = "Sân 3", Status = CourtStatus.Available, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var court4 = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType1.Id, Name = "Sân 4", Status = CourtStatus.Available, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var courtVip = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType2.Id, Name = "Sân VIP 1", Status = CourtStatus.Available, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var courtP1 = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType3.Id, Name = "Sân P1", Status = CourtStatus.Available, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var courtP2 = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType3.Id, Name = "Sân P2", Status = CourtStatus.Available, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        await context.Courts.AddRangeAsync([court1, court2, court3, court4, courtVip, courtP1, courtP2], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 9. PriceTables & PriceTableRules
        // ──────────────────────────────────────────────────────────────
        var priceTable1 = new PriceTable
        {
            Id = Guid.NewGuid(),
            CourtTypeId = courtType1.Id,
            Name = "Bảng Giá Cầu Lông Tiêu Chuẩn 2026",
            DefaultPrice = 80000m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var priceTable2 = new PriceTable
        {
            Id = Guid.NewGuid(),
            CourtTypeId = courtType3.Id,
            Name = "Bảng Giá Pickleball 2026",
            DefaultPrice = 150000m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await context.PriceTables.AddRangeAsync([priceTable1, priceTable2], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var priceRules = new[]
        {
            // T2 -> T6: 05:00 -> 17:00 (Thấp điểm)
            new PriceTableRule
            {
                Id = Guid.NewGuid(),
                PriceTableId = priceTable1.Id,
                DayOfWeekFrom = 1,
                DayOfWeekTo = 5,
                StartTime = new TimeOnly(5, 0),
                EndTime = new TimeOnly(17, 0),
                FixedCustomerPrice = 70000m,
                WalkInCustomerPrice = 80000m
            },
            // T2 -> T6: 17:00 -> 23:00 (Cao điểm tối)
            new PriceTableRule
            {
                Id = Guid.NewGuid(),
                PriceTableId = priceTable1.Id,
                DayOfWeekFrom = 1,
                DayOfWeekTo = 5,
                StartTime = new TimeOnly(17, 0),
                EndTime = new TimeOnly(23, 0),
                FixedCustomerPrice = 110000m,
                WalkInCustomerPrice = 130000m
            },
            // T7 & CN: 05:00 -> 23:00 (Cuối tuần)
            new PriceTableRule
            {
                Id = Guid.NewGuid(),
                PriceTableId = priceTable1.Id,
                DayOfWeekFrom = 6,
                DayOfWeekTo = 0,
                StartTime = new TimeOnly(5, 0),
                EndTime = new TimeOnly(23, 0),
                FixedCustomerPrice = 120000m,
                WalkInCustomerPrice = 140000m
            },
            // Pickleball: 06:00 -> 22:00
            new PriceTableRule
            {
                Id = Guid.NewGuid(),
                PriceTableId = priceTable2.Id,
                DayOfWeekFrom = 1,
                DayOfWeekTo = 0,
                StartTime = new TimeOnly(6, 0),
                EndTime = new TimeOnly(22, 0),
                FixedCustomerPrice = 140000m,
                WalkInCustomerPrice = 160000m
            }
        };
        await context.PriceTableRules.AddRangeAsync(priceRules, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 10. FixedTimeBlocks & FixedTimeBlockCourts
        // ──────────────────────────────────────────────────────────────
        // 42 = bit 1 (Mon) + bit 3 (Wed) + bit 5 (Fri) = 2 + 8 + 32
        var fixedTimeBlock = new FixedTimeBlock
        {
            Id = Guid.NewGuid(),
            CourtTypeId = courtType1.Id,
            DaysOfWeekMask = 42,
            StartTime = new TimeOnly(18, 0),
            EndTime = new TimeOnly(20, 0),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await context.FixedTimeBlocks.AddAsync(fixedTimeBlock, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var fixedBlockCourt = new FixedTimeBlockCourt
        {
            FixedTimeBlockId = fixedTimeBlock.Id,
            CourtId = court1.Id
        };
        await context.FixedTimeBlockCourts.AddAsync(fixedBlockCourt, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 11. ServiceCategories, Services & ServiceBranches
        // ──────────────────────────────────────────────────────────────
        var catBeverage = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = userOwner.Id,
            Name = "Nước giải khát & Năng lượng",
            Description = "Các loại nước uống giải nhiệt và bù khoáng",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var catEquipment = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = userOwner.Id,
            Name = "Dụng cụ thể thao & Phụ kiện",
            Description = "Quả cầu, vợt, quấn cán, cước đan vợt",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var catRental = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = userOwner.Id,
            Name = "Dịch vụ cho thuê",
            Description = "Thuê vợt thi đấu, giày thể thao",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await context.ServiceCategories.AddRangeAsync([catBeverage, catEquipment, catRental], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var srvAquafina = new Service
        {
            Id = Guid.NewGuid(),
            CategoryId = catBeverage.Id,
            Name = "Nước khoáng Aquafina 500ml",
            Unit = "Chai",
            ImageId = waterImg.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var srvRevive = new Service
        {
            Id = Guid.NewGuid(),
            CategoryId = catBeverage.Id,
            Name = "Nước tăng lực Revive Chanh Muối",
            Unit = "Chai",
            ImageId = reviveImg.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var srvShuttlecock = new Service
        {
            Id = Guid.NewGuid(),
            CategoryId = catEquipment.Id,
            Name = "Hộp cầu lông Hải Yến (12 quả)",
            Unit = "Ống",
            ImageId = shuttlecockImg.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var srvRacketRental = new Service
        {
            Id = Guid.NewGuid(),
            CategoryId = catRental.Id,
            Name = "Thuê vợt cầu lông Yonex cao cấp",
            Unit = "Cây/Lượt",
            ImageId = racketImg.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await context.Services.AddRangeAsync([srvAquafina, srvRevive, srvShuttlecock, srvRacketRental], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var serviceBranches = new[]
        {
            new ServiceBranch { ServiceId = srvAquafina.Id, BranchId = branch1.Id, Price = 10000m, IsActive = true },
            new ServiceBranch { ServiceId = srvRevive.Id, BranchId = branch1.Id, Price = 15000m, IsActive = true },
            new ServiceBranch { ServiceId = srvShuttlecock.Id, BranchId = branch1.Id, Price = 240000m, IsActive = true },
            new ServiceBranch { ServiceId = srvRacketRental.Id, BranchId = branch1.Id, Price = 30000m, IsActive = true },
            new ServiceBranch { ServiceId = srvAquafina.Id, BranchId = branch2.Id, Price = 12000m, IsActive = true },
            new ServiceBranch { ServiceId = srvRevive.Id, BranchId = branch2.Id, Price = 18000m, IsActive = true }
        };
        await context.ServiceBranches.AddRangeAsync(serviceBranches, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 12. Orders, OrderDetails, OrderServices, FixedConfigs
        // ──────────────────────────────────────────────────────────────
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Order 1: Đặt sân cố định thường của Player 1
        var order1 = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = "ORD-20260928-001",
            BranchId = branch1.Id,
            CustomerName = userPlayer1.FullName,
            CustomerPhone = userPlayer1.PhoneNumber!,
            Channel = OrderChannel.Online,
            OrderType = OrderType.Fixed,
            OrderDate = today,
            HoldExpiresAt = DateTime.UtcNow.AddMinutes(30),
            PlayerId = userPlayer1.Id,
            Status = OrderStatus.AwaitingPayment,
            TotalCourtAmount = 0,
            TotalServiceAmount = 0,
            DiscountAmount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Order 2: Đặt sân cho Kèo giao lưu (SocialMatch)
        var order2 = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = "ORD-20260928-002",
            BranchId = branch1.Id,
            CustomerName = userPlayer1.FullName,
            CustomerPhone = userPlayer1.PhoneNumber!,
            Channel = OrderChannel.Pos,
            OrderType = OrderType.Normal,
            OrderDate = today.AddDays(2),
            HoldExpiresAt = DateTime.UtcNow.AddHours(2),
            PlayerId = userPlayer1.Id,
            Status = OrderStatus.AwaitingPayment,
            TotalCourtAmount = 0,
            TotalServiceAmount = 0,
            DiscountAmount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Order 3: Đặt sân tổ chức Sự kiện/Giải đấu (SportEvent) do Chủ sân tạo
        var order3 = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = "ORD-20260928-003",
            BranchId = branch1.Id,
            CustomerName = userOwner.FullName,
            CustomerPhone = userOwner.PhoneNumber!,
            Channel = OrderChannel.Pos,
            OrderType = OrderType.Event,
            OrderDate = today.AddDays(14),
            HoldExpiresAt = DateTime.UtcNow.AddDays(1),
            PlayerId = userOwner.Id,
            Status = OrderStatus.AwaitingPayment,
            TotalCourtAmount = 0,
            TotalServiceAmount = 0,
            DiscountAmount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await context.Orders.AddRangeAsync([order1, order2, order3], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var orderDetail1 = new OrderDetail
        {
            Id = Guid.NewGuid(),
            OrderId = order1.Id,
            CourtId = court1.Id,
            StartTime = new TimeOnly(18, 0),
            EndTime = new TimeOnly(19, 0),
            Date = today,
            Price = 110000m
        };

        var orderDetail2 = new OrderDetail
        {
            Id = Guid.NewGuid(),
            OrderId = order2.Id,
            CourtId = court2.Id,
            StartTime = new TimeOnly(19, 0),
            EndTime = new TimeOnly(21, 0),
            Date = today.AddDays(2),
            Price = 220000m
        };

        var orderDetail3 = new OrderDetail
        {
            Id = Guid.NewGuid(),
            OrderId = order3.Id,
            CourtId = courtVip.Id,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(18, 0),
            Date = today.AddDays(14),
            Price = 1000000m
        };

        await context.OrderDetails.AddRangeAsync([orderDetail1, orderDetail2, orderDetail3], cancellationToken);

        var orderService1 = new OrderService
        {
            Id = Guid.NewGuid(),
            OrderId = order1.Id,
            ServiceId = srvRevive.Id,
            Quantity = 2,
            UnitPrice = 15000m
        };
        await context.OrderServices.AddAsync(orderService1, cancellationToken);

        var fixedConfig = new FixedOrderConfig
        {
            Id = Guid.NewGuid(),
            OrderId = order1.Id,
            StartDate = today,
            EndDate = today.AddMonths(1),
            DaysOfWeekMask = 42,
            StartTime = new TimeOnly(18, 0),
            EndTime = new TimeOnly(19, 0)
        };
        await context.FixedOrderConfigs.AddAsync(fixedConfig, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var fixedConfigCourt = new FixedOrderConfigCourt
        {
            FixedOrderConfigId = fixedConfig.Id,
            CourtId = court1.Id
        };
        await context.FixedOrderConfigCourts.AddAsync(fixedConfigCourt, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 13. RetailOrders & RetailOrderItems
        // ──────────────────────────────────────────────────────────────
        var retailOrder = new RetailOrder
        {
            Id = Guid.NewGuid(),
            BranchId = branch1.Id,
            OrderDate = today,
            TotalAmount = 35000m,
            DiscountAmount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await context.RetailOrders.AddAsync(retailOrder, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var retailItem1 = new RetailOrderItem
        {
            Id = Guid.NewGuid(),
            RetailOrderId = retailOrder.Id,
            ServiceId = srvAquafina.Id,
            Quantity = 2,
            UnitPrice = 10000m
        };
        var retailItem2 = new RetailOrderItem
        {
            Id = Guid.NewGuid(),
            RetailOrderId = retailOrder.Id,
            ServiceId = srvRevive.Id,
            Quantity = 1,
            UnitPrice = 15000m
        };
        await context.RetailOrderItems.AddRangeAsync([retailItem1, retailItem2], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 14. PaymentTransactions
        // ──────────────────────────────────────────────────────────────
        var payment1 = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            Amount = 140000m,
            Type = PaymentTransactionType.Payment,
            Method = PaymentMethod.QrTransfer,
            OrderId = order1.Id,
            ProofImageId = paymentProofImg.Id,
            CreatedAt = DateTime.UtcNow
        };

        await context.PaymentTransactions.AddAsync(payment1, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 15. Reviews
        // ──────────────────────────────────────────────────────────────
        var review = new Review
        {
            Id = Guid.NewGuid(),
            BranchId = branch1.Id,
            OrderId = order1.Id,
            PlayerId = userPlayer1.Id,
            Rating = 5,
            Comment = "Sân thảm mới và rất êm, ánh sáng đạt chuẩn thi đấu không bị chói mắt, nhân viên nhiệt tình hỗ trợ!",
            Images = new List<ReviewImage> 
            { 
                new ReviewImage { Id = Guid.NewGuid(), ImageId = reviewImg.Id } 
            },
            CreatedAt = DateTime.UtcNow
        };

        await context.Reviews.AddAsync(review, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 16. SocialMatches & MatchParticipants
        // ──────────────────────────────────────────────────────────────
        var socialMatch = new SocialMatch
        {
            Id = Guid.NewGuid(),
            OrderId = order2.Id,
            BranchId = branch1.Id,
            SportTypeId = sportBadminton.Id,
            HostId = userPlayer1.Id,
            Date = today.AddDays(2),
            StartTime = new TimeOnly(19, 0),
            EndTime = new TimeOnly(21, 0),
            MissingPlayers = 2,
            FeePerPlayer = 50000m,
            ApprovalMode = 0,
            SkillLevel = "Trình độ B-C",
            Description = "Giao lưu cầu lông phong trào tối thứ 4, vui vẻ rèn luyện sức khỏe, có nước uống miễn phí.",
            Status = SocialMatchStatus.Open,
            CreatedAt = DateTime.UtcNow
        };

        await context.SocialMatches.AddAsync(socialMatch, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var participant = new MatchParticipant
        {
            Id = Guid.NewGuid(),
            MatchId = socialMatch.Id,
            PlayerId = userPlayer2.Id,
            Status = ParticipantStatus.PendingApproval,
            JoinedAt = DateTime.UtcNow
        };
        await context.MatchParticipants.AddAsync(participant, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 17. SportEvents & EventTickets
        // ──────────────────────────────────────────────────────────────
        var sportEvent = new SportEvent
        {
            Id = Guid.NewGuid(),
            OrderId = order3.Id,
            SportTypeId = sportBadminton.Id,
            Date = today.AddDays(14),
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(18, 0),
            Title = "Giải Cầu Lông Mở Rộng Sài Gòn Star Cup 2026",
            Slots = 32,
            AvailableSlot = 32,
            TicketPrice = 200000m,
            SkillLevelFrom = "Tự do",
            SkillLevelTo = "Tự do",
            Description = "Giải đấu giao lưu tranh cúp mùa thu 2026, cơ cấu giải thưởng cờ, cúp và tiền thưởng hấp dẫn.",
            Status = EventStatus.Open,
            CreatedAt = DateTime.UtcNow
        };

        await context.SportEvents.AddAsync(sportEvent, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var ticket = new EventTicket
        {
            Id = Guid.NewGuid(),
            EventId = sportEvent.Id,
            PlayerId = userPlayer2.Id,
            Quantity = 1,
            PaymentMethod = PaymentMethod.QrTransfer,
            Price = 200000m,
            Status = EventTicketStatus.PendingApproval,
            CreatedAt = DateTime.UtcNow
        };
        await context.EventTickets.AddAsync(ticket, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Database seeded successfully with all entities!");
    }
}
