using System.Net;
using System.Net.Http.Json;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.Commands.CreateOrderOnline;
using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.Infrastructure.Database;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace IntegrationTests.Orders;

public sealed class CreateOrderOnlineConcurrencyTests : BaseIntegrationTest
{
    public CreateOrderOnlineConcurrencyTests(IntegrationTestWebAppFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task CreateOrderOnline_ConcurrentRequestsForSameSlot_OnlyOneSucceedsAndOtherReceivesConflict()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var (branch, courtType, court, priceTable) = await GetOrCreateBookingTestDataAsync(dbContext);
        var (player1, player2) = await GetPlayersAsync(dbContext);

        var client1 = CreateAuthenticatedClient(player1, [RoleConstants.Player]);
        var client2 = CreateAuthenticatedClient(player2, [RoleConstants.Player]);

        var targetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10));
        var startTime = new TimeOnly(8, 0);
        var endTime = new TimeOnly(9, 0);

        var command1 = new CreateOrderOnlineCommand(
            branch.Id,
            player1.FullName,
            player1.PhoneNumber ?? "0934000004",
            "Player 1 đặt sân",
            [
                new CourtBookingSlot(
                    courtType.Id,
                    priceTable.Id,
                    [new CourtSlotItem(court.Id, targetDate, startTime, endTime)]
                )
            ]);

        var command2 = new CreateOrderOnlineCommand(
            branch.Id,
            player2.FullName,
            player2.PhoneNumber ?? "0934000005",
            "Player 2 đặt sân cùng giờ",
            [
                new CourtBookingSlot(
                    courtType.Id,
                    priceTable.Id,
                    [new CourtSlotItem(court.Id, targetDate, startTime, endTime)]
                )
            ]);

        // Act - Gửi 2 request đặt lịch cùng 1 lúc cho cùng sân, cùng ngày, cùng khung giờ
        var task1 = client1.PostAsJsonAsync("/api/v1/orders", command1);
        var task2 = client2.PostAsJsonAsync("/api/v1/orders", command2);

        var responses = await Task.WhenAll(task1, task2);

        // Assert - Chính xác 1 request thành công (200 OK) và request còn lại phải bị từ chối do xung đột (409 Conflict)
        var okResponse = responses.SingleOrDefault(r => r.StatusCode == HttpStatusCode.OK);
        var conflictResponse = responses.SingleOrDefault(r => r.StatusCode == HttpStatusCode.Conflict);

        okResponse.ShouldNotBeNull("Phải có đúng 1 request đặt sân thành công.");
        conflictResponse.ShouldNotBeNull("Request thứ hai đặt trùng giờ phải bị từ chối với mã lỗi 409 Conflict.");

        // Kiểm tra chi tiết lỗi xung đột trả về từ ProblemDetails
        var problem = await conflictResponse.Content.ReadFromJsonAsync<ProblemDetails>();
        problem.ShouldNotBeNull();
        problem.Detail.ShouldNotBeNull();
        problem.Detail.ShouldContain("đã có người đặt hoặc đang giữ chỗ");

        // Kiểm tra trong database: chỉ tồn tại duy nhất 1 chi tiết đơn đặt sân cho khung giờ này
        using var verificationScope = Factory.Services.CreateScope();
        var verificationDb = verificationScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var bookedSlotsCount = await verificationDb.OrderDetails
            .CountAsync(od => od.CourtId == court.Id && od.Date == targetDate && od.StartTime == startTime && od.EndTime == endTime);

        bookedSlotsCount.ShouldBe(1, "Database chỉ được phép ghi nhận duy nhất 1 đơn hàng cho khung giờ này.");
    }

    [Fact]
    public async Task CreateOrderOnline_OverlappingTimeSlots_SecondRequestReturnsConflict()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var (branch, courtType, court, priceTable) = await GetOrCreateBookingTestDataAsync(dbContext);
        var (player1, player2) = await GetPlayersAsync(dbContext);

        var client1 = CreateAuthenticatedClient(player1, [RoleConstants.Player]);
        var client2 = CreateAuthenticatedClient(player2, [RoleConstants.Player]);

        var targetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(11));

        // Player 1 đặt 08:00 - 10:00
        var command1 = new CreateOrderOnlineCommand(
            branch.Id,
            player1.FullName,
            player1.PhoneNumber ?? "0934000004",
            "Player 1 đặt 2 tiếng",
            [
                new CourtBookingSlot(
                    courtType.Id,
                    priceTable.Id,
                    [new CourtSlotItem(court.Id, targetDate, new TimeOnly(8, 0), new TimeOnly(10, 0))]
                )
            ]);

        // Player 2 cố tình đặt đè vào: 09:00 - 11:00 (giao nhau lúc 09:00 - 10:00)
        var command2 = new CreateOrderOnlineCommand(
            branch.Id,
            player2.FullName,
            player2.PhoneNumber ?? "0934000005",
            "Player 2 đặt giao giờ",
            [
                new CourtBookingSlot(
                    courtType.Id,
                    priceTable.Id,
                    [new CourtSlotItem(court.Id, targetDate, new TimeOnly(9, 0), new TimeOnly(11, 0))]
                )
            ]);

        // Act - Player 1 đặt trước thành công
        var res1 = await client1.PostAsJsonAsync("/api/v1/orders", command1);
        res1.StatusCode.ShouldBe(HttpStatusCode.OK);

        // Player 2 đặt đè khung giờ
        var res2 = await client2.PostAsJsonAsync("/api/v1/orders", command2);

        // Assert - Player 2 phải bị từ chối
        res2.StatusCode.ShouldBe(HttpStatusCode.Conflict);

        var problem = await res2.Content.ReadFromJsonAsync<ProblemDetails>();
        problem.ShouldNotBeNull();
        problem.Detail.ShouldNotBeNull();
        problem.Detail.ShouldContain("đã có người đặt hoặc đang giữ chỗ");
    }

    [Fact]
    public async Task CreateOrderOnline_DifferentCourtsAtSameTime_BothSucceed()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var (branch, courtType, court1, priceTable) = await GetOrCreateBookingTestDataAsync(dbContext);
        var (player1, player2) = await GetPlayersAsync(dbContext);

        // Tạo thêm court 2 trong cùng chi nhánh
        var court2 = await dbContext.Courts.FirstOrDefaultAsync(c => c.CourtTypeId == courtType.Id && c.Id != court1.Id);
        if (court2 == null)
        {
            court2 = new Court
            {
                Id = Guid.NewGuid(),
                CourtTypeId = courtType.Id,
                Name = "Sân 2 - Concurrency Test",
                Status = CourtStatus.Available,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Courts.Add(court2);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        var client1 = CreateAuthenticatedClient(player1, [RoleConstants.Player]);
        var client2 = CreateAuthenticatedClient(player2, [RoleConstants.Player]);

        var targetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(12));
        var startTime = new TimeOnly(14, 0);
        var endTime = new TimeOnly(15, 0);

        var command1 = new CreateOrderOnlineCommand(
            branch.Id,
            player1.FullName,
            player1.PhoneNumber ?? "0934000004",
            "Player 1 đặt sân 1",
            [
                new CourtBookingSlot(
                    courtType.Id,
                    priceTable.Id,
                    [new CourtSlotItem(court1.Id, targetDate, startTime, endTime)]
                )
            ]);

        var command2 = new CreateOrderOnlineCommand(
            branch.Id,
            player2.FullName,
            player2.PhoneNumber ?? "0934000005",
            "Player 2 đặt sân 2",
            [
                new CourtBookingSlot(
                    courtType.Id,
                    priceTable.Id,
                    [new CourtSlotItem(court2.Id, targetDate, startTime, endTime)]
                )
            ]);

        // Act - Cả hai cùng đặt cùng khung giờ nhưng ở 2 sân khác nhau
        var task1 = client1.PostAsJsonAsync("/api/v1/orders", command1);
        var task2 = client2.PostAsJsonAsync("/api/v1/orders", command2);

        var responses = await Task.WhenAll(task1, task2);

        // Assert - Cả 2 đều thành công vì không bị tranh chấp sân
        responses[0].StatusCode.ShouldBe(HttpStatusCode.OK);
        responses[1].StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    private static async Task<(ApplicationUser Player1, ApplicationUser Player2)> GetPlayersAsync(IApplicationDbContext dbContext)
    {
        var player1 = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == DatabaseSeeder.Player1UserId);
        var player2 = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == DatabaseSeeder.Player2UserId);

        if (player1 == null)
        {
            player1 = new ApplicationUser
            {
                Id = DatabaseSeeder.Player1UserId,
                FullName = "Player One",
                Email = "player1@courtbooking.com",
                UserName = "player1@courtbooking.com",
                PhoneNumber = "0934000004",
                AccountType = AccountType.Player,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(player1);
        }

        if (player2 == null)
        {
            player2 = new ApplicationUser
            {
                Id = DatabaseSeeder.Player2UserId,
                FullName = "Player Two",
                Email = "player2@courtbooking.com",
                UserName = "player2@courtbooking.com",
                PhoneNumber = "0934000005",
                AccountType = AccountType.Player,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(player2);
        }

        await ((DbContext)dbContext).SaveChangesAsync();
        return (player1, player2);
    }

    private static async Task<(Branch Branch, CourtType CourtType, Court Court, PriceTable PriceTable)> GetOrCreateBookingTestDataAsync(IApplicationDbContext dbContext)
    {
        var branch = await dbContext.Branches.Include(b => b.QrImage).FirstOrDefaultAsync(b => b.IsActive);
        if (branch == null)
        {
            var qr = new CourtBooking.Domain.Entities.Images.Image
            {
                Id = Guid.NewGuid(),
                StorageKey = "branches/qr/test.png",
                StorageProvider = StorageProvider.S3,
                Status = ImageStatus.Attached,
                CreatedAt = DateTime.UtcNow,
                AttachedAt = DateTime.UtcNow
            };
            dbContext.Images.Add(qr);

            branch = new Branch
            {
                Id = Guid.NewGuid(),
                CourtOwnerId = DatabaseSeeder.CourtOwnerUserId,
                Name = "Chi Nhánh Test Concurrency",
                Hotline = "0912345678",
                Province = "Hồ Chí Minh",
                District = "Quận 1",
                Street = "123 Lê Duẩn",
                OpenTime = new TimeOnly(5, 0),
                CloseTime = new TimeOnly(23, 0),
                AccountNumber = "0123456789",
                AccountName = "TEST OWNER",
                QrImageId = qr.Id,
                QrImage = qr,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Branches.Add(branch);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        var courtType = await dbContext.CourtTypes.FirstOrDefaultAsync(ct => ct.BranchId == branch.Id);
        if (courtType == null)
        {
            courtType = new CourtType
            {
                Id = Guid.NewGuid(),
                BranchId = branch.Id,
                Name = "Loại Sân Test",
                MinutesConfig = 60
            };
            dbContext.CourtTypes.Add(courtType);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        var court = await dbContext.Courts.FirstOrDefaultAsync(c => c.CourtTypeId == courtType.Id && c.Status == CourtStatus.Available);
        if (court == null)
        {
            court = new Court
            {
                Id = Guid.NewGuid(),
                CourtTypeId = courtType.Id,
                Name = "Sân 1 - Test",
                Status = CourtStatus.Available,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Courts.Add(court);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        var priceTable = await dbContext.PriceTables.FirstOrDefaultAsync(pt => pt.CourtTypeId == courtType.Id && pt.IsActive);
        if (priceTable == null)
        {
            priceTable = new PriceTable
            {
                Id = Guid.NewGuid(),
                CourtTypeId = courtType.Id,
                Name = "Bảng Giá Test",
                DefaultPrice = 100_000m,
                DefaultWalkInPrice = 120_000m,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.PriceTables.Add(priceTable);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        return (branch, courtType, court, priceTable);
    }
}
