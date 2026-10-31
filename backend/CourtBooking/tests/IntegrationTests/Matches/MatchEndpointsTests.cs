using System.Net;
using System.Net.Http.Json;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Matches.Commands.CreateMatch;
using CourtBooking.Application.Features.V1.Matches.Dtos;
using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Matches;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using IntegrationTests.Common;
using IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace IntegrationTests.Matches;

public sealed class MatchEndpointsTests : BaseIntegrationTest
{
    public MatchEndpointsTests(ApiFixture fixture) : base(fixture)
    {
    }

    [Fact]
    public async Task CreateMatch_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        var command = new CreateMatchCommand(
            Guid.NewGuid(),
            "Trung bình",
            2,
            50000m,
            0,
            "Giao lưu cầu lông");

        // Act - Call without authorization
        var response = await HttpClient.PostAsJsonAsync("/api/v1/matches", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateMatch_WhenInvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var player = await GetOrCreatePlayerAsync(db);

        using var client = CreateAuthenticatedClient(player, [RoleConstants.Player]);
        var command = new CreateMatchCommand(
            Guid.NewGuid(),
            "Trung bình",
            0, // Invalid: MissingPlayers must be > 0
            50000m,
            0,
            "Kèo lỗi");

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/matches", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateMatch_WhenValidConfirmedOrder_ReturnsCreatedAndPersistsMatch()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var host = await GetOrCreatePlayerAsync(db);

        var sportType = await db.SportTypes.FirstOrDefaultAsync() ?? new SportType { Id = Guid.NewGuid(), Name = "Pickleball" };
        if (!await db.SportTypes.AnyAsync(s => s.Id == sportType.Id))
        {
            db.SportTypes.Add(sportType);
        }

        var branch = await db.Branches.Include(b => b.BranchSportTypes).FirstOrDefaultAsync();
        if (branch == null)
        {
            branch = new Branch
            {
                Id = Guid.NewGuid(),
                CourtOwnerId = Guid.NewGuid(),
                Name = "CLB Giao Lưu Hà Nội",
                Province = "Hà Nội",
                District = "Cầu Giấy",
                Street = "1 Hoàng Đạo Thúy",
                Hotline = "0988776655",
                AccountNumber = "987654321",
                AccountName = "NGUYEN VAN C",
                OpenTime = new TimeOnly(6, 0),
                CloseTime = new TimeOnly(23, 0),
                ReviewAverage = 4.8,
                IsActive = true,
                BranchSportTypes = [new BranchSportType { BranchId = Guid.NewGuid(), SportTypeId = sportType.Id }]
            };
            db.Branches.Add(branch);
            await db.SaveChangesAsync();
        }
        else if (branch.BranchSportTypes.Count == 0)
        {
            branch.BranchSportTypes.Add(new BranchSportType { BranchId = branch.Id, SportTypeId = sportType.Id });
            await db.SaveChangesAsync();
        }

        var court = await db.Courts.FirstOrDefaultAsync(c => c.CourtType.BranchId == branch.Id);
        if (court == null)
        {
            var courtType = await db.CourtTypes.FirstOrDefaultAsync(ct => ct.BranchId == branch.Id);
            if (courtType == null)
            {
                courtType = new CourtType
                {
                    Id = Guid.NewGuid(),
                    BranchId = branch.Id,
                    Name = "Sân tiêu chuẩn",
                    MinutesConfig = 60
                };
                db.CourtTypes.Add(courtType);
                await db.SaveChangesAsync();
            }

            court = new Court
            {
                Id = Guid.NewGuid(),
                CourtTypeId = courtType.Id,
                Name = "Sân 1",
                Status = CourtStatus.Available,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.Courts.Add(court);
            await db.SaveChangesAsync();
        }

        var orderId = Guid.NewGuid();
        var order = new Order
        {
            Id = orderId,
            BranchId = branch.Id,
            PlayerId = host.Id,
            Status = OrderStatus.Confirmed,
            Channel = OrderChannel.Online,
            OrderCode = $"ORD-MCH-{Guid.NewGuid():N}"[..12].ToUpperInvariant(),
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CustomerName = host.FullName,
            CustomerPhone = host.PhoneNumber ?? "0988000111",
            OrderType = OrderType.Normal,
            HoldExpiresAt = DateTime.UtcNow.AddHours(2),
            Details =
            [
                new OrderDetail
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    CourtId = court.Id,
                    Date = DateOnly.FromDateTime(DateTime.Today.AddDays(3)),
                    StartTime = new TimeOnly(18, 0),
                    EndTime = new TimeOnly(20, 0),
                    Price = 120000m
                }
            ]
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        using var client = CreateAuthenticatedClient(host, [RoleConstants.Player]);
        var command = new CreateMatchCommand(
            orderId,
            "Khá",
            3,
            40000m,
            0,
            "Tìm 3 bạn đánh đôi Pickleball.");

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/matches", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<CreateMatchResponse>();
        result.ShouldNotBeNull();
        result.MatchId.ShouldNotBe(Guid.Empty);

        // Verify observable state in real DB
        using var verifyScope = Fixture.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var match = await verifyDb.SocialMatches
            .Include(m => m.Participants)
            .FirstOrDefaultAsync(m => m.Id == result.MatchId);

        match.ShouldNotBeNull();
        match.OrderId.ShouldBe(orderId);
        match.HostId.ShouldBe(host.Id);
        match.MissingPlayers.ShouldBe(3);
        match.AvailableSlots.ShouldBe(3);
        match.Participants.Count.ShouldBe(1);
        match.Participants[0].PlayerId.ShouldBe(host.Id);
        match.Participants[0].Status.ShouldBe(ParticipantStatus.Confirmed);
    }

    [Fact]
    public async Task GetMatches_ReturnsOkWithMatchList()
    {
        // Act - Public anonymous endpoint
        var response = await HttpClient.GetAsync("/api/v1/matches?page=1&pageSize=10");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var matches = await response.Content.ReadFromJsonAsync<PagedList<MatchDto>>();
        matches.ShouldNotBeNull();
    }

    [Fact]
    public async Task JoinMatch_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        var matchId = Guid.NewGuid();

        // Act - Call without authorization
        var response = await HttpClient.PostAsync($"/api/v1/matches/{matchId}/join", null);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task JoinMatch_WhenValid_ReturnsOkAndDecrementsSlots()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var host = await GetOrCreatePlayerAsync(db);

        var joiningPlayer = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FullName = "Joining Player",
            PhoneNumber = "0911223344",
            Email = $"joiner-{Guid.NewGuid():N}@test.com",
            AccountType = AccountType.Player,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        db.Users.Add(joiningPlayer);

        var branch = await db.Branches.FirstOrDefaultAsync();
        if (branch == null)
        {
            branch = new Branch
            {
                Id = Guid.NewGuid(),
                CourtOwnerId = Guid.NewGuid(),
                Name = "CLB Giao Lưu Hà Nội",
                Province = "Hà Nội",
                District = "Cầu Giấy",
                Street = "1 Hoàng Đạo Thúy",
                Hotline = "0988776655",
                AccountNumber = "987654321",
                AccountName = "NGUYEN VAN C",
                OpenTime = new TimeOnly(6, 0),
                CloseTime = new TimeOnly(23, 0),
                ReviewAverage = 4.8,
                IsActive = true
            };
            db.Branches.Add(branch);
            await db.SaveChangesAsync();
        }

        var sportType = await db.SportTypes.FirstOrDefaultAsync();
        if (sportType == null)
        {
            sportType = new SportType { Id = Guid.NewGuid(), Name = "Pickleball" };
            db.SportTypes.Add(sportType);
            await db.SaveChangesAsync();
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            BranchId = branch.Id,
            PlayerId = host.Id,
            Status = OrderStatus.Confirmed,
            Channel = OrderChannel.Online,
            OrderCode = $"ORD-JN-{Guid.NewGuid():N}"[..12].ToUpperInvariant(),
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CustomerName = host.FullName,
            CustomerPhone = host.PhoneNumber ?? "0988000222",
            OrderType = OrderType.Normal,
            HoldExpiresAt = DateTime.UtcNow.AddHours(2)
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var matchId = Guid.NewGuid();
        var match = new SocialMatch
        {
            Id = matchId,
            OrderId = order.Id,
            BranchId = branch.Id,
            SportTypeId = sportType.Id,
            HostId = host.Id,
            Date = DateOnly.FromDateTime(DateTime.Today.AddDays(2)),
            StartTime = new TimeOnly(19, 0),
            EndTime = new TimeOnly(21, 0),
            MissingPlayers = 2,
            AvailableSlots = 2,
            FeePerPlayer = 50000m,
            ApprovalMode = 0, // Auto approve
            SkillLevel = "Cơ bản",
            CreatedAt = DateTime.UtcNow
        };

        db.SocialMatches.Add(match);
        await db.SaveChangesAsync();

        using var client = CreateAuthenticatedClient(joiningPlayer, [RoleConstants.Player]);

        // Act
        var response = await client.PostAsync($"/api/v1/matches/{matchId}/join", null);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var joinResponse = await response.Content.ReadFromJsonAsync<JoinMatchResponse>();
        joinResponse.ShouldNotBeNull();
        joinResponse.ParticipantId.ShouldNotBe(Guid.Empty);

        // Verify observable state in real DB
        using var verifyScope = Fixture.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var updatedMatch = await verifyDb.SocialMatches
            .Include(m => m.Participants)
            .FirstAsync(m => m.Id == matchId);

        updatedMatch.AvailableSlots.ShouldBe(1);
        var participant = updatedMatch.Participants.FirstOrDefault(p => p.PlayerId == joiningPlayer.Id);
        participant.ShouldNotBeNull();
        participant.Status.ShouldBe(ParticipantStatus.Confirmed);
    }

    private static async Task<ApplicationUser> GetOrCreatePlayerAsync(IApplicationDbContext db)
    {
        var player = await db.Users.FirstOrDefaultAsync(u => u.AccountType == AccountType.Player);
        if (player != null) return player;

        player = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FullName = "Player Test",
            PhoneNumber = "0909000111",
            Email = $"player-{Guid.NewGuid():N}@test.com",
            AccountType = AccountType.Player,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        db.Users.Add(player);
        await db.SaveChangesAsync();
        return player;
    }
}
