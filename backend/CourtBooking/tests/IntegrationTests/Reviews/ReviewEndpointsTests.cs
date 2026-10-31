using System.Net;
using System.Net.Http.Json;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Reviews.Commands.CreateReview;
using CourtBooking.Application.Features.V1.Reviews.Queries.GetReviewByBranch;
using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using IntegrationTests.Common;
using IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace IntegrationTests.Reviews;

public sealed class ReviewEndpointsTests : BaseIntegrationTest
{
    public ReviewEndpointsTests(ApiFixture fixture) : base(fixture)
    {
    }

    [Fact]
    public async Task CreateReview_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        var command = new CreateReviewCommand(Guid.NewGuid(), 5, "Sân chất lượng!");

        // Act - Call with unauthenticated client
        var response = await HttpClient.PostAsJsonAsync("/api/v1/reviews", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateReview_WhenInvalidRating_ReturnsProblemDetails()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var player = await GetOrCreatePlayerAsync(db);

        using var client = CreateAuthenticatedClient(player, [RoleConstants.Player]);
        var command = new CreateReviewCommand(Guid.NewGuid(), 10, "Rating 10 vượt quá 5 sao");

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/reviews", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateReview_WhenOrderDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var player = await GetOrCreatePlayerAsync(db);

        using var client = CreateAuthenticatedClient(player, [RoleConstants.Player]);
        var command = new CreateReviewCommand(Guid.NewGuid(), 5, "Đơn không tồn tại");

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/reviews", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateReview_WhenValidCompletedOrder_ReturnsOkAndPersistsReview()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var player = await GetOrCreatePlayerAsync(db);

        var branch = await db.Branches.FirstOrDefaultAsync() ?? CreateBranch();
        if (!await db.Branches.AnyAsync(b => b.Id == branch.Id))
        {
            db.Branches.Add(branch);
        }

        var orderId = Guid.NewGuid();
        var order = new Order
        {
            Id = orderId,
            BranchId = branch.Id,
            PlayerId = player.Id,
            Status = OrderStatus.Completed,
            Channel = OrderChannel.Online,
            OrderCode = $"ORD-REV-{Guid.NewGuid():N}"[..12].ToUpperInvariant(),
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CustomerName = player.FullName,
            CustomerPhone = player.PhoneNumber ?? "0909998877",
            OrderType = OrderType.Normal,
            HoldExpiresAt = DateTime.UtcNow.AddHours(1)
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        using var client = CreateAuthenticatedClient(player, [RoleConstants.Player]);
        var command = new CreateReviewCommand(orderId, 5, "Sân rất đẹp, nhân viên nhiệt tình!");

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/reviews", command);

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var reviewId = await response.Content.ReadFromJsonAsync<Guid>();
        reviewId.ShouldNotBe(Guid.Empty);

        // Verify observable state in real DB
        using var verifyScope = Fixture.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var review = await verifyDb.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId);
        review.ShouldNotBeNull();
        review.Rating.ShouldBe((byte)5);
        review.Comment.ShouldBe("Sân rất đẹp, nhân viên nhiệt tình!");
        review.PlayerId.ShouldBe(player.Id);
        review.OrderId.ShouldBe(orderId);
    }

    [Fact]
    public async Task GetReviews_WhenBranchDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        var nonExistentBranchId = Guid.NewGuid();

        // Act
        var response = await HttpClient.GetAsync($"/api/v1/reviews?branchId={nonExistentBranchId}");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetReviews_WhenBranchExists_ReturnsOkWithPagedReviews()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var branch = await db.Branches.FirstOrDefaultAsync() ?? CreateBranch();
        if (!await db.Branches.AnyAsync(b => b.Id == branch.Id))
        {
            db.Branches.Add(branch);
            await db.SaveChangesAsync();
        }

        // Act
        var response = await HttpClient.GetAsync($"/api/v1/reviews?branchId={branch.Id}&page=1&pageSize=10");

        // Assert
        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var reviewDto = await response.Content.ReadFromJsonAsync<ReviewDto>();
        reviewDto.ShouldNotBeNull();
        reviewDto.BranchId.ShouldBe(branch.Id);
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

    private static Branch CreateBranch()
    {
        return new Branch
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = Guid.NewGuid(),
            Name = "CLB Pickleball Saigon",
            Province = "Hồ Chí Minh",
            District = "Quận 2",
            Street = "456 Mai Chí Thọ",
            Hotline = "0903334455",
            AccountNumber = "123456789",
            AccountName = "NGUYEN VAN B",
            OpenTime = new TimeOnly(5, 0),
            CloseTime = new TimeOnly(23, 0),
            ReviewAverage = 4.5,
            IsActive = true
        };
    }
}
