using Application.UnitTests.Abstractions;
using CourtBooking.Application.Features.V1.Reviews.Queries.GetReviewByBranch;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Reviews;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Reviews;

public sealed class GetReviewByBranchQueryHandlerTests : BaseHandlerTest
{
    private readonly Guid _branchId = Guid.NewGuid();

    [Fact]
    public async Task Handle_WhenBranchDoesNotExist_ShouldReturnNotFoundError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var handler = new GetReviewByBranchQueryHandler(dbContext);
        var query = new GetReviewByBranchQuery(_branchId, 1, 10);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<NotFoundError>();
    }

    [Fact]
    public async Task Handle_WhenBranchHasReviews_ShouldReturnPagedReviewsAndAverageRating()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var branch = new Branch
        {
            Id = _branchId,
            CourtOwnerId = Guid.NewGuid(),
            Name = "CLB Sài Gòn Star",
            Province = "Hồ Chí Minh",
            District = "Quận 7",
            Street = "123 Nguyễn Thị Thập",
            Hotline = "0901234567",
            OpenTime = new TimeOnly(6, 0),
            CloseTime = new TimeOnly(22, 0),
            ReviewAverage = 4.0,
            AccountNumber = "12345678",
            AccountName = "NGUYEN VAN A",
            IsActive = true
        };

        var player = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            FullName = "Trần Văn A",
            Email = "trana@gmail.com"
        };

        var review1 = new Review
        {
            Id = Guid.NewGuid(),
            BranchId = _branchId,
            OrderId = Guid.NewGuid(),
            PlayerId = player.Id,
            Player = player,
            Rating = 5,
            Comment = "Rất tuyệt vời",
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        };

        var review2 = new Review
        {
            Id = Guid.NewGuid(),
            BranchId = _branchId,
            OrderId = Guid.NewGuid(),
            PlayerId = player.Id,
            Player = player,
            Rating = 3,
            Comment = "Bình thường",
            CreatedAt = DateTime.UtcNow.AddHours(-2)
        };

        dbContext.Branches.Add(branch);
        dbContext.Users.Add(player);
        dbContext.Reviews.AddRange(review1, review2);
        await dbContext.SaveChangesAsync();

        var handler = new GetReviewByBranchQueryHandler(dbContext);
        var query = new GetReviewByBranchQuery(_branchId, 1, 10);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.BranchId.ShouldBe(_branchId);
        result.Value.AverageRating.ShouldBe(4.0); // (5 + 3) / 2 = 4.0
        result.Value.Reviews.Items.Count.ShouldBe(2);
        result.Value.Reviews.TotalCount.ShouldBe(2);
        result.Value.Reviews.Items[0].Rating.ShouldBe((byte)5);
        result.Value.Reviews.Items[0].PlayerName.ShouldBe("Trần Văn A");
    }
}

