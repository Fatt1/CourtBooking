using Application.UnitTests.Abstractions;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Reviews.Commands.CreateReview;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Reviews;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Reviews;

public sealed class CreateReviewCommandHandlerTests : BaseHandlerTest
{
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _orderId = Guid.NewGuid();
    private readonly Guid _branchId = Guid.NewGuid();

    [Fact]
    public async Task Handle_WhenOrderDoesNotExist_ShouldReturnNotFoundError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateReviewCommandHandler(dbContext, userContext);
        var command = new CreateReviewCommand(_orderId, 5, "Sân rất tốt!");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<NotFoundError>();
    }

    [Fact]
    public async Task Handle_WhenUserIsNotOrderOwner_ShouldReturnForbiddenError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var differentPlayerId = Guid.NewGuid();
        var order = CreateTestOrder(_orderId, _branchId, differentPlayerId, OrderStatus.Completed, OrderChannel.Online);
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateReviewCommandHandler(dbContext, userContext);
        var command = new CreateReviewCommand(_orderId, 5, "Sân rất tốt!");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ForbiddenError>();
        result.Error.Message.ShouldContain("chính mình");
    }

    [Fact]
    public async Task Handle_WhenOrderStatusIsNotCompleted_ShouldReturnConflictError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var order = CreateTestOrder(_orderId, _branchId, _userId, OrderStatus.Confirmed, OrderChannel.Online);
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateReviewCommandHandler(dbContext, userContext);
        var command = new CreateReviewCommand(_orderId, 5, "Chưa chơi xong");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldContain("hoàn thành ca chơi");
    }

    [Fact]
    public async Task Handle_WhenOrderChannelIsNotOnline_ShouldReturnConflictError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var order = CreateTestOrder(_orderId, _branchId, _userId, OrderStatus.Completed, OrderChannel.Pos);
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateReviewCommandHandler(dbContext, userContext);
        var command = new CreateReviewCommand(_orderId, 5, "Đơn POS tại quầy");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldContain("online");
    }

    [Fact]
    public async Task Handle_WhenOrderAlreadyReviewed_ShouldReturnConflictError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var order = CreateTestOrder(_orderId, _branchId, _userId, OrderStatus.Completed, OrderChannel.Online);
        var existingReview = new Review
        {
            Id = Guid.NewGuid(),
            BranchId = _branchId,
            OrderId = _orderId,
            PlayerId = _userId,
            Rating = 4,
            Comment = "Đã đánh giá lần 1",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };
        dbContext.Orders.Add(order);
        dbContext.Reviews.Add(existingReview);
        await dbContext.SaveChangesAsync();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateReviewCommandHandler(dbContext, userContext);
        var command = new CreateReviewCommand(_orderId, 5, "Đánh giá lần 2");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldContain("đã đánh giá đơn hàng này rồi");
    }

    [Fact]
    public async Task Handle_WhenValidReview_ShouldCreateReviewAndRecalculateBranchAverageRating()
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

        var order = CreateTestOrder(_orderId, _branchId, _userId, OrderStatus.Completed, OrderChannel.Online);
        var oldReview = new Review
        {
            Id = Guid.NewGuid(),
            BranchId = _branchId,
            OrderId = Guid.NewGuid(),
            PlayerId = Guid.NewGuid(),
            Rating = 4,
            Comment = "Đánh giá cũ 4 sao",
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        };

        dbContext.Branches.Add(branch);
        dbContext.Orders.Add(order);
        dbContext.Reviews.Add(oldReview);
        await dbContext.SaveChangesAsync();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateReviewCommandHandler(dbContext, userContext);
        var command = new CreateReviewCommand(_orderId, 5, "Sân rất đẹp, 5 sao!");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldNotBe(Guid.Empty);

        var createdReview = await dbContext.Reviews.FirstOrDefaultAsync(r => r.Id == result.Value);
        createdReview.ShouldNotBeNull();
        createdReview.Rating.ShouldBe((byte)5);
        createdReview.Comment.ShouldBe("Sân rất đẹp, 5 sao!");
        createdReview.BranchId.ShouldBe(_branchId);
        createdReview.OrderId.ShouldBe(_orderId);
        createdReview.PlayerId.ShouldBe(_userId);

        // Kiểm tra điểm đánh giá trung bình: (4 + 5) / 2 = 4.5
        var updatedBranch = await dbContext.Branches.FindAsync(_branchId);
        updatedBranch.ShouldNotBeNull();
        updatedBranch.ReviewAverage.ShouldBe(4.5);
    }

    private static Order CreateTestOrder(Guid orderId, Guid branchId, Guid playerId, OrderStatus status, OrderChannel channel)
    {
        return new Order
        {
            Id = orderId,
            BranchId = branchId,
            PlayerId = playerId,
            Status = status,
            Channel = channel,
            OrderCode = "ORD-TEST-001",
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CustomerName = "Nguyễn Văn Người Chơi",
            CustomerPhone = "0987654321",
            OrderType = OrderType.Normal,
            HoldExpiresAt = DateTime.UtcNow.AddHours(2)
        };
    }
}

