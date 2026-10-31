using Application.UnitTests.Abstractions;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Matches.Commands.CreateMatch;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Matches;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Matches;

public sealed class CreateMatchCommandHandlerTests : BaseHandlerTest
{
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _orderId = Guid.NewGuid();
    private readonly Guid _branchId = Guid.NewGuid();
    private readonly Guid _sportTypeId = Guid.NewGuid();

    [Fact]
    public async Task Handle_WhenOrderDoesNotExist_ShouldReturnNotFoundError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateMatchCommandHandler(dbContext, userContext);
        var command = new CreateMatchCommand(_orderId, "Trung bình", 2, 50000m, 0, "Tìm bạn");

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
        var branch = CreateTestBranch(_branchId, _sportTypeId);
        var orderOwnerId = Guid.NewGuid();
        var order = CreateTestOrder(_orderId, _branchId, orderOwnerId, OrderStatus.Confirmed);
        order.Branch = branch;

        dbContext.Branches.Add(branch);
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateMatchCommandHandler(dbContext, userContext);
        var command = new CreateMatchCommand(_orderId, "Trung bình", 2, 50000m, 0, "Tìm bạn");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ForbiddenError>();
        result.Error.Message.ShouldContain("chủ sở hữu");
    }

    [Fact]
    public async Task Handle_WhenOrderStatusIsNotConfirmed_ShouldReturnConflictError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var branch = CreateTestBranch(_branchId, _sportTypeId);
        var order = CreateTestOrder(_orderId, _branchId, _userId, OrderStatus.AwaitingPayment);
        order.Branch = branch;

        dbContext.Branches.Add(branch);
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateMatchCommandHandler(dbContext, userContext);
        var command = new CreateMatchCommand(_orderId, "Trung bình", 2, 50000m, 0, "Tìm bạn");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldContain("xác nhận thanh toán");
    }

    [Fact]
    public async Task Handle_WhenMatchAlreadyExistsForOrder_ShouldReturnConflictError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var branch = CreateTestBranch(_branchId, _sportTypeId);
        var order = CreateTestOrder(_orderId, _branchId, _userId, OrderStatus.Confirmed);
        order.Branch = branch;

        var existingMatch = new SocialMatch
        {
            Id = Guid.NewGuid(),
            OrderId = _orderId,
            BranchId = _branchId,
            SportTypeId = _sportTypeId,
            HostId = _userId,
            Date = DateOnly.FromDateTime(DateTime.Today.AddDays(2)),
            StartTime = new TimeOnly(18, 0),
            EndTime = new TimeOnly(20, 0),
            MissingPlayers = 2,
            AvailableSlots = 2,
            FeePerPlayer = 50000m,
            ApprovalMode = 0,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Branches.Add(branch);
        dbContext.Orders.Add(order);
        dbContext.SocialMatches.Add(existingMatch);
        await dbContext.SaveChangesAsync();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateMatchCommandHandler(dbContext, userContext);
        var command = new CreateMatchCommand(_orderId, "Trung bình", 2, 50000m, 0, "Tìm bạn");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldContain("đã được mở kèo giao lưu");
    }

    [Fact]
    public async Task Handle_WhenOrderHasNoDetails_ShouldReturnConflictError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var branch = CreateTestBranch(_branchId, _sportTypeId);
        var order = CreateTestOrder(_orderId, _branchId, _userId, OrderStatus.Confirmed);
        order.Branch = branch;

        dbContext.Branches.Add(branch);
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateMatchCommandHandler(dbContext, userContext);
        var command = new CreateMatchCommand(_orderId, "Trung bình", 2, 50000m, 0, "Tìm bạn");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldContain("chưa có thông tin chi tiết ca chơi");
    }

    [Fact]
    public async Task Handle_WhenOrderStartTimeIsInThePast_ShouldReturnConflictError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var branch = CreateTestBranch(_branchId, _sportTypeId);
        var order = CreateTestOrder(_orderId, _branchId, _userId, OrderStatus.Confirmed);
        order.Branch = branch;

        var pastDetail = new OrderDetail
        {
            Id = Guid.NewGuid(),
            OrderId = _orderId,
            CourtId = Guid.NewGuid(),
            Date = DateOnly.FromDateTime(DateTime.Today.AddDays(-1)),
            StartTime = new TimeOnly(7, 0),
            EndTime = new TimeOnly(9, 0),
            Price = 100000m
        };
        order.Details.Add(pastDetail);

        dbContext.Branches.Add(branch);
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateMatchCommandHandler(dbContext, userContext);
        var command = new CreateMatchCommand(_orderId, "Trung bình", 2, 50000m, 0, "Tìm bạn");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldContain("đã diễn ra hoặc đã bắt đầu");
    }

    [Fact]
    public async Task Handle_WhenValidCommand_ShouldCreateMatchAndAddHostAsConfirmedParticipant()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var branch = CreateTestBranch(_branchId, _sportTypeId);

        var order = CreateTestOrder(_orderId, _branchId, _userId, OrderStatus.Confirmed);
        order.Branch = branch;

        var futureDetail = new OrderDetail
        {
            Id = Guid.NewGuid(),
            OrderId = _orderId,
            CourtId = Guid.NewGuid(),
            Date = DateOnly.FromDateTime(DateTime.Today.AddDays(2)),
            StartTime = new TimeOnly(18, 0),
            EndTime = new TimeOnly(20, 0),
            Price = 150000m
        };
        order.Details.Add(futureDetail);

        dbContext.Branches.Add(branch);
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new CreateMatchCommandHandler(dbContext, userContext);
        var command = new CreateMatchCommand(
            _orderId,
            "Khá",
            3,
            60000m,
            0,
            "Giao lưu trình độ khá");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldNotBe(Guid.Empty);

        var match = await dbContext.SocialMatches
            .Include(m => m.Participants)
            .FirstOrDefaultAsync(m => m.Id == result.Value);

        match.ShouldNotBeNull();
        match.OrderId.ShouldBe(_orderId);
        match.BranchId.ShouldBe(_branchId);
        match.SportTypeId.ShouldBe(_sportTypeId);
        match.HostId.ShouldBe(_userId);
        match.MissingPlayers.ShouldBe(3);
        match.AvailableSlots.ShouldBe(3);
        match.FeePerPlayer.ShouldBe(60000m);
        match.ApprovalMode.ShouldBe((byte)0);
        match.SkillLevel.ShouldBe("Khá");
        match.Description.ShouldBe("Giao lưu trình độ khá");

        // Host phải được tự động thêm vào Participants với trạng thái Confirmed
        match.Participants.Count.ShouldBe(1);
        var hostParticipant = match.Participants[0];
        hostParticipant.PlayerId.ShouldBe(_userId);
        hostParticipant.Status.ShouldBe(ParticipantStatus.Confirmed);
    }

    private static Branch CreateTestBranch(Guid branchId, Guid sportTypeId)
    {
        return new Branch
        {
            Id = branchId,
            CourtOwnerId = Guid.NewGuid(),
            Name = "CLB Thể Thao",
            Province = "Hồ Chí Minh",
            District = "Bình Thạnh",
            Street = "123 Điện Biên Phủ",
            Hotline = "0900000000",
            AccountNumber = "123456789",
            AccountName = "NGUYEN VAN DUC",
            OpenTime = new TimeOnly(6, 0),
            CloseTime = new TimeOnly(23, 0),
            BranchSportTypes =
            [
                new BranchSportType { BranchId = branchId, SportTypeId = sportTypeId }
            ]
        };
    }

    private static Order CreateTestOrder(Guid orderId, Guid branchId, Guid playerId, OrderStatus status)
    {
        return new Order
        {
            Id = orderId,
            BranchId = branchId,
            PlayerId = playerId,
            Status = status,
            Channel = OrderChannel.Online,
            OrderCode = "ORD-TEST-002",
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CustomerName = "Nguyễn Văn Đức",
            CustomerPhone = "0912345678",
            OrderType = OrderType.Normal,
            HoldExpiresAt = DateTime.UtcNow.AddHours(2),
            Details = []
        };
    }
}
