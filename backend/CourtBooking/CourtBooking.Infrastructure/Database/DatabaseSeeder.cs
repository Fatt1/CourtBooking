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
    // ── Default User IDs (dùng cố định để test, dev và gán vào UserContext) ──
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
        var adminAvatar = Image.Create(StorageProvider.S3, "images/avatars/admin.webp");
        var ownerAvatar = Image.Create(StorageProvider.S3, "images/avatars/owner.webp");
        var player1Avatar = Image.Create(StorageProvider.S3, "images/avatars/player1.webp");
        var player2Avatar = Image.Create(StorageProvider.S3, "images/avatars/player2.webp");
        var ownerQrImage = Image.Create(StorageProvider.S3, "images/qr/owner-payment.webp");

        var badmintonIcon = Image.Create(StorageProvider.S3, "images/sports/badminton.webp");
        var pickleballIcon = Image.Create(StorageProvider.S3, "images/sports/pickleball.webp");
        var futsalIcon = Image.Create(StorageProvider.S3, "images/sports/futsal.webp");

        var branch1Img1 = Image.Create(StorageProvider.S3, "images/branches/saigon-star-1.webp");
        var branch1Img2 = Image.Create(StorageProvider.S3, "images/branches/saigon-star-2.webp");
        var branch1Img3 = Image.Create(StorageProvider.S3, "images/branches/saigon-star-3.webp");
        var branch2Img1 = Image.Create(StorageProvider.S3, "images/branches/phunhuan-arena-1.webp");

        var waterImg = Image.Create(StorageProvider.S3, "images/services/aquafina.webp");
        var reviveImg = Image.Create(StorageProvider.S3, "images/services/revive.webp");
        var shuttlecockImg = Image.Create(StorageProvider.S3, "images/services/shuttlecock.webp");
        var racketImg = Image.Create(StorageProvider.S3, "images/services/racket.webp");

        var paymentProofImg = Image.Create(StorageProvider.S3, "images/payments/proof-ord-001.webp");
        var reviewImg = Image.Create(StorageProvider.S3, "images/reviews/review-branch1.webp");

        var allImages = new[]
        {
           adminAvatar, ownerAvatar, player1Avatar, player2Avatar, ownerQrImage,
           badmintonIcon, pickleballIcon, futsalIcon,
           branch1Img1, branch1Img2, branch1Img3, branch2Img1,
           waterImg, reviveImg, shuttlecockImg, racketImg,
           paymentProofImg, reviewImg
        };

        foreach (var img in allImages)
        {
            img.MarkAsAttached();
        }
        await context.Images.AddRangeAsync(allImages, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 2. Roles
        // ──────────────────────────────────────────────────────────────
        var roleAdmin = ApplicationRole.Create("Admin", "Quản trị viên toàn hệ thống");
        roleAdmin.Id = AdminRoleId;
        var roleOwner = ApplicationRole.Create("CourtOwner", "Chủ cơ sở thể thao / quản lý sân");
        roleOwner.Id = CourtOwnerRoleId;
        var rolePlayer = ApplicationRole.Create("Player", "Khách hàng / Người chơi");
        rolePlayer.Id = PlayerRoleId;

        await context.Roles.AddRangeAsync([roleAdmin, roleOwner, rolePlayer], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 3. Users & UserRoles
        // ──────────────────────────────────────────────────────────────
        var hasher = new PasswordHasher<ApplicationUser>();

        var userAdmin = ApplicationUser.Create("Hệ Thống Admin", "admin@courtbooking.com", "0901000001", AccountType.Admin);
        userAdmin.Id = AdminUserId;
        userAdmin.PasswordHash = hasher.HashPassword(userAdmin, "Admin@123456");
        userAdmin.SecurityStamp = Guid.NewGuid().ToString();

        var userOwner = ApplicationUser.Create("Nguyễn Văn Chủ Sân", "owner@courtbooking.com", "0912000002", AccountType.CourtOwner);
        userOwner.Id = CourtOwnerUserId;
        userOwner.PasswordHash = hasher.HashPassword(userOwner, "Owner@123456");
        userOwner.SecurityStamp = Guid.NewGuid().ToString();



        var userPlayer1 = ApplicationUser.Create("Lê Văn Cầu Thủ", "player1@courtbooking.com", "0934000004", AccountType.Player);
        userPlayer1.Id = Player1UserId;
        userPlayer1.PasswordHash = hasher.HashPassword(userPlayer1, "Player@123456");
        userPlayer1.SecurityStamp = Guid.NewGuid().ToString();

        var userPlayer2 = ApplicationUser.Create("Phạm Thị Khách Hàng", "player2@courtbooking.com", "0945000005", AccountType.Player);
        userPlayer2.Id = Player2UserId;
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
        var courtOwnerProfile = CourtOwner.Create(userOwner.Id, "CLB Cầu Lông & Pickleball Sài Gòn Star", ownerQrImage.Id, "0312345678");
        var playerProfile1 = PlayerProfile.Create(userPlayer1.Id, Gender.Male, new DateOnly(1995, 5, 20), player1Avatar.Id);
        var playerProfile2 = PlayerProfile.Create(userPlayer2.Id, Gender.Female, new DateOnly(1998, 10, 15), player2Avatar.Id);
        var refreshToken = RefreshToken.Create(userPlayer1.Id, "seed-refresh-token-player1-secure-jwt", DateTime.UtcNow.AddDays(30));

        await context.CourtOwners.AddAsync(courtOwnerProfile, cancellationToken);
        await context.PlayerProfiles.AddRangeAsync([playerProfile1, playerProfile2], cancellationToken);
        await context.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 5. Subscriptions (ServicePackages & CourtOwnerSubscription)
        // ──────────────────────────────────────────────────────────────
        var pkgBasic = ServicePackage.Create("Gói Cơ Bản (1 Tháng)", 299000m, "Quản lý tối đa 4 sân, tính năng đặt sân cơ bản.", 1);
        var pkgStandard = ServicePackage.Create("Gói Tiêu Chuẩn (6 Tháng)", 1499000m, "Quản lý tối đa 10 sân, đầy đủ bán lẻ và thống kê.", 6);
        var pkgEnterprise = ServicePackage.Create("Gói Doanh Nghiệp (12 Tháng)", 2699000m, "Không giới hạn sân, ưu tiên hỗ trợ 24/7 và giải đấu.", 12);

        await context.ServicePackages.AddRangeAsync([pkgBasic, pkgStandard, pkgEnterprise], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var ownerSub = CourtOwnerSubscription.Create(
           userOwner.Id,
           pkgEnterprise.Id,
           pkgEnterprise.Price,
           DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30)),
           DateOnly.FromDateTime(DateTime.UtcNow.AddDays(335)));

        await context.CourtOwnerSubscriptions.AddAsync(ownerSub, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 6. SportTypes
        // ──────────────────────────────────────────────────────────────
        var sportBadminton = SportType.Create("Cầu lông", badmintonIcon.Id);
        var sportPickleball = SportType.Create("Pickleball", pickleballIcon.Id);
        var sportFutsal = SportType.Create("Bóng đá mini", futsalIcon.Id);

        await context.SportTypes.AddRangeAsync([sportBadminton, sportPickleball, sportFutsal], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 7. Branches & BranchImages
        // ──────────────────────────────────────────────────────────────
        var branch1 = Branch.Create(
           userOwner.Id,
           sportBadminton.Id,
           "CLB Cầu Lông & Pickleball Sài Gòn Star - Chi Nhánh 1",
           "https://maps.google.com/search?q=saigon-star-branch-1",
           "Hồ Chí Minh",
           "Quận 7",
           "123 Nguyễn Thị Thập, Phường Tân Phú",
           new TimeOnly(5, 0),
           new TimeOnly(23, 0),
           ownerQrImage.Id,
           "1903678912345",
           "NGUYEN VAN CHU SAN");

        var branch2 = Branch.Create(
           userOwner.Id,
           sportPickleball.Id,
           "CLB Pickleball Phú Nhuận Arena - Chi Nhánh 2",
           "https://maps.google.com/search?q=phunhuan-arena-branch-2",
           "Hồ Chí Minh",
           "Phú Nhuận",
           "45 Phan Xích Long, Phường 2",
           new TimeOnly(6, 0),
           new TimeOnly(22, 0),
           ownerQrImage.Id,
           "1903678912345",
           "NGUYEN VAN CHU SAN");

        await context.Branches.AddRangeAsync([branch1, branch2], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var branchImages = new[]
        {
           BranchImage.Create(branch1.Id, branch1Img1.Id, 0),
           BranchImage.Create(branch1.Id, branch1Img2.Id, 1),
           BranchImage.Create(branch1.Id, branch1Img3.Id, 2),
           BranchImage.Create(branch2.Id, branch2Img1.Id, 0)
        };
        await context.BranchImages.AddRangeAsync(branchImages, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 8. CourtTypes & Courts
        // ──────────────────────────────────────────────────────────────
        var courtType1 = CourtType.Create(branch1.Id, "Sân Cầu Lông Tiêu Chuẩn Thảm PVC", 60);
        var courtType2 = CourtType.Create(branch1.Id, "Sân Cầu Lông VIP Thi Đấu", 60);
        var courtType3 = CourtType.Create(branch2.Id, "Sân Pickleball Ngoài Trời", 60);

        await context.CourtTypes.AddRangeAsync([courtType1, courtType2, courtType3], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var court1 = Court.Create(courtType1.Id, "Sân 1");
        var court2 = Court.Create(courtType1.Id, "Sân 2");
        var court3 = Court.Create(courtType1.Id, "Sân 3");
        var court4 = Court.Create(courtType1.Id, "Sân 4");
        var courtVip = Court.Create(courtType2.Id, "Sân VIP 1");
        var courtP1 = Court.Create(courtType3.Id, "Sân P1");
        var courtP2 = Court.Create(courtType3.Id, "Sân P2");

        await context.Courts.AddRangeAsync([court1, court2, court3, court4, courtVip, courtP1, courtP2], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 9. PriceTables & PriceTableRules
        // ──────────────────────────────────────────────────────────────
        var priceTable1 = PriceTable.Create(courtType1.Id, "Bảng Giá Cầu Lông Tiêu Chuẩn 2026", 80000m);
        var priceTable2 = PriceTable.Create(courtType3.Id, "Bảng Giá Pickleball 2026", 150000m);

        await context.PriceTables.AddRangeAsync([priceTable1, priceTable2], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var priceRules = new[]
        {
           // T2 -> T6: 05:00 -> 17:00 (Thấp điểm)
           PriceTableRule.Create(priceTable1.Id, 1, 5, new TimeOnly(5, 0), new TimeOnly(17, 0), 70000m, 80000m),
           // T2 -> T6: 17:00 -> 23:00 (Cao điểm tối)
           PriceTableRule.Create(priceTable1.Id, 1, 5, new TimeOnly(17, 0), new TimeOnly(23, 0), 110000m, 130000m),
           // T7 & CN: 05:00 -> 23:00 (Cuối tuần)
           PriceTableRule.Create(priceTable1.Id, 6, 0, new TimeOnly(5, 0), new TimeOnly(23, 0), 120000m, 140000m),
           // Pickleball: 06:00 -> 22:00
           PriceTableRule.Create(priceTable2.Id, 1, 0, new TimeOnly(6, 0), new TimeOnly(22, 0), 140000m, 160000m)
        };
        await context.PriceTableRules.AddRangeAsync(priceRules, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 10. FixedTimeBlocks & FixedTimeBlockCourts
        // ──────────────────────────────────────────────────────────────
        // 42 = bit 1 (Mon) + bit 3 (Wed) + bit 5 (Fri) = 2 + 8 + 32
        var fixedTimeBlock = FixedTimeBlock.Create(courtType1.Id, 42, new TimeOnly(18, 0), new TimeOnly(20, 0));
        await context.FixedTimeBlocks.AddAsync(fixedTimeBlock, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var fixedBlockCourt = FixedTimeBlockCourt.Create(fixedTimeBlock.Id, court1.Id);
        await context.FixedTimeBlockCourts.AddAsync(fixedBlockCourt, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 11. ServiceCategories, Services & ServiceBranches
        // ──────────────────────────────────────────────────────────────
        var catBeverage = ServiceCategory.Create("Nước giải khát & Năng lượng", "Các loại nước uống giải nhiệt và bù khoáng");
        var catEquipment = ServiceCategory.Create("Dụng cụ thể thao & Phụ kiện", "Quả cầu, vợt, quấn cán, cước đan vợt");
        var catRental = ServiceCategory.Create("Dịch vụ cho thuê", "Thuê vợt thi đấu, giày thể thao");

        await context.ServiceCategories.AddRangeAsync([catBeverage, catEquipment, catRental], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var srvAquafina = Service.Create(catBeverage.Id, "Nước khoáng Aquafina 500ml", "Chai", waterImg.Id);
        var srvRevive = Service.Create(catBeverage.Id, "Nước tăng lực Revive Chanh Muối", "Chai", reviveImg.Id);
        var srvShuttlecock = Service.Create(catEquipment.Id, "Hộp cầu lông Hải Yến (12 quả)", "Ống", shuttlecockImg.Id);
        var srvRacketRental = Service.Create(catRental.Id, "Thuê vợt cầu lông Yonex cao cấp", "Cây/Lượt", racketImg.Id);

        await context.Services.AddRangeAsync([srvAquafina, srvRevive, srvShuttlecock, srvRacketRental], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var serviceBranches = new[]
        {
           ServiceBranch.Create(srvAquafina.Id, branch1.Id, 10000m),
           ServiceBranch.Create(srvRevive.Id, branch1.Id, 15000m),
           ServiceBranch.Create(srvShuttlecock.Id, branch1.Id, 240000m),
           ServiceBranch.Create(srvRacketRental.Id, branch1.Id, 30000m),
           ServiceBranch.Create(srvAquafina.Id, branch2.Id, 12000m),
           ServiceBranch.Create(srvRevive.Id, branch2.Id, 18000m)
        };
        await context.ServiceBranches.AddRangeAsync(serviceBranches, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 12. Orders, OrderDetails, OrderServices, FixedConfigs
        // ──────────────────────────────────────────────────────────────
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Order 1: Đặt sân cố định thường của Player 1
        var order1 = Order.Create(
           "ORD-20260928-001",
           branch1.Id,
           userPlayer1.FullName,
           userPlayer1.PhoneNumber!,
           OrderChannel.Online,
           OrderType.Fixed,
           today,
           DateTime.UtcNow.AddMinutes(30),
           userPlayer1.Id);

        // Order 2: Đặt sân cho Kèo giao lưu (SocialMatch)
        var order2 = Order.Create(
           "ORD-20260928-002",
           branch1.Id,
           userPlayer1.FullName,
           userPlayer1.PhoneNumber!,
           OrderChannel.Pos,
           OrderType.Normal,
           today.AddDays(2),
           DateTime.UtcNow.AddHours(2),
           userPlayer1.Id);

        // Order 3: Đặt sân tổ chức Sự kiện/Giải đấu (SportEvent) do Chủ sân tạo
        var order3 = Order.Create(
           "ORD-20260928-003",
           branch1.Id,
           userOwner.FullName,
           userOwner.PhoneNumber!,
           OrderChannel.Pos,
           OrderType.Event,
           today.AddDays(14),
           DateTime.UtcNow.AddDays(1),
           userOwner.Id);

        await context.Orders.AddRangeAsync([order1, order2, order3], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var orderDetail1 = OrderDetail.Create(order1.Id, court1.Id, new TimeOnly(18, 0), new TimeOnly(19, 0), today, 110000m);
        var orderDetail2 = OrderDetail.Create(order2.Id, court2.Id, new TimeOnly(19, 0), new TimeOnly(21, 0), today.AddDays(2), 220000m);
        var orderDetail3 = OrderDetail.Create(order3.Id, courtVip.Id, new TimeOnly(8, 0), new TimeOnly(18, 0), today.AddDays(14), 1000000m);

        await context.OrderDetails.AddRangeAsync([orderDetail1, orderDetail2, orderDetail3], cancellationToken);

        var orderService1 = OrderService.Create(order1.Id, srvRevive.Id, 2, 15000m);
        await context.OrderServices.AddAsync(orderService1, cancellationToken);

        var fixedConfig = FixedOrderConfig.Create(
           order1.Id,
           today,
           today.AddMonths(1),
           42,
           new TimeOnly(18, 0),
           new TimeOnly(19, 0));
        await context.FixedOrderConfigs.AddAsync(fixedConfig, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var fixedConfigCourt = FixedOrderConfigCourt.Create(fixedConfig.Id, court1.Id);
        await context.FixedOrderConfigCourts.AddAsync(fixedConfigCourt, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 13. RetailOrders & RetailOrderItems
        // ──────────────────────────────────────────────────────────────
        var retailOrder = RetailOrder.Create(branch1.Id, today);
        await context.RetailOrders.AddAsync(retailOrder, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var retailItem1 = RetailOrderItem.Create(retailOrder.Id, srvAquafina.Id, 2, 10000m);
        var retailItem2 = RetailOrderItem.Create(retailOrder.Id, srvRevive.Id, 1, 15000m);
        await context.RetailOrderItems.AddRangeAsync([retailItem1, retailItem2], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 14. PaymentTransactions
        // ──────────────────────────────────────────────────────────────
        var payment1 = PaymentTransaction.Create(
           140000m,
           PaymentTransactionType.Payment,
           PaymentMethod.QrTransfer,
           order1.Id,
           paymentProofImg.Id);

        await context.PaymentTransactions.AddAsync(payment1, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 15. Reviews
        // ──────────────────────────────────────────────────────────────
        var review = Review.Create(
           branch1.Id,
           order1.Id,
           userPlayer1.Id,
           5,
           "Sân thảm mới và rất êm, ánh sáng đạt chuẩn thi đấu không bị chói mắt, nhân viên nhiệt tình hỗ trợ!",
           reviewImg.Id);

        await context.Reviews.AddAsync(review, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 16. SocialMatches & MatchParticipants
        // ──────────────────────────────────────────────────────────────
        var socialMatch = SocialMatch.Create(
           order2.Id,
           branch1.Id,
           sportBadminton.Id,
           userPlayer1.Id,
           today.AddDays(2),
           new TimeOnly(19, 0),
           new TimeOnly(21, 0),
           2,
           50000m,
           0,
           "Trình độ B-C",
           "Giao lưu cầu lông phong trào tối thứ 4, vui vẻ rèn luyện sức khỏe, có nước uống miễn phí.");

        await context.SocialMatches.AddAsync(socialMatch, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var participant = MatchParticipant.Create(socialMatch.Id, userPlayer2.Id);
        await context.MatchParticipants.AddAsync(participant, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // ──────────────────────────────────────────────────────────────
        // 17. SportEvents & EventTickets
        // ──────────────────────────────────────────────────────────────
        var sportEvent = SportEvent.Create(
           order3.Id,
           sportBadminton.Id,
           today.AddDays(14),
           new TimeOnly(8, 0),
           new TimeOnly(18, 0),
           "Giải Cầu Lông Mở Rộng Sài Gòn Star Cup 2026",
           32,
           200000m,
           "Tự do",
           "Tự do",
           "Giải đấu giao lưu tranh cúp mùa thu 2026, cơ cấu giải thưởng cờ, cúp và tiền thưởng hấp dẫn.");

        await context.SportEvents.AddAsync(sportEvent, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        var ticket = EventTicket.Create(sportEvent.Id, userPlayer2.Id, 1, PaymentMethod.QrTransfer, 200000m);
        await context.EventTickets.AddAsync(ticket, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Database seeded successfully with all entities!");
    }
}
