using Application.UnitTests.Abstractions;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Matches.Commands.JoinMatch;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Matches;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Matches;

public sealed class JoinMatchCommandHandlerTests : BaseHandlerTest
{
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _hostId = Guid.NewGuid();
    private readonly Guid _matchId = Guid.NewGuid();
    private readonly Guid _orderId = Guid.NewGuid();
    private readonly Guid _branchId = Guid.NewGuid();
    private readonly Guid _sportTypeId = Guid.NewGuid();

    [Fact]
    public async Task Handle_WhenMatchDoesNotExist_ShouldReturnNotFoundError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new JoinMatchCommandHandler(dbContext, userContext);
        var command = new JoinMatchCommand(_matchId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<NotFoundError>();
    }

    [Fact]
    public async Task Handle_WhenMatchHasNoAvailableSlots_ShouldReturnConflictError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        await SeedDependenciesAsync(dbContext);
        var match = CreateTestMatch(_matchId, _hostId, availableSlots: 0, approvalMode: 0);
        dbContext.SocialMatches.Add(match);
        await dbContext.SaveChangesAsync();
        dbContext.ChangeTracker.Clear();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new JoinMatchCommandHandler(dbContext, userContext);
        var command = new JoinMatchCommand(_matchId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldContain("đã đủ người");
    }

    [Fact]
    public async Task Handle_WhenUserIsHost_ShouldReturnConflictError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        await SeedDependenciesAsync(dbContext);
        var match = CreateTestMatch(_matchId, _hostId, availableSlots: 2, approvalMode: 0);
        dbContext.SocialMatches.Add(match);
        await dbContext.SaveChangesAsync();
        dbContext.ChangeTracker.Clear();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_hostId); // User is the host!

        var handler = new JoinMatchCommandHandler(dbContext, userContext);
        var command = new JoinMatchCommand(_matchId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldContain("người tạo kèo");
    }

    [Fact]
    public async Task Handle_WhenUserIsAlreadyConfirmedParticipant_ShouldReturnConflictError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        await SeedDependenciesAsync(dbContext);
        var match = CreateTestMatch(_matchId, _hostId, availableSlots: 2, approvalMode: 0);
        match.Participants.Add(new MatchParticipant
        {
            Id = Guid.NewGuid(),
            MatchId = _matchId,
            PlayerId = _userId,
            Status = ParticipantStatus.Confirmed,
            JoinedAt = DateTime.UtcNow.AddHours(-1)
        });

        dbContext.SocialMatches.Add(match);
        await dbContext.SaveChangesAsync();
        dbContext.ChangeTracker.Clear();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new JoinMatchCommandHandler(dbContext, userContext);
        var command = new JoinMatchCommand(_matchId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldContain("thành viên chính thức");
    }

    [Fact]
    public async Task Handle_WhenUserIsPendingApproval_ShouldReturnConflictError()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        await SeedDependenciesAsync(dbContext);
        var match = CreateTestMatch(_matchId, _hostId, availableSlots: 2, approvalMode: 1);
        match.Participants.Add(new MatchParticipant
        {
            Id = Guid.NewGuid(),
            MatchId = _matchId,
            PlayerId = _userId,
            Status = ParticipantStatus.PendingApproval,
            JoinedAt = DateTime.UtcNow.AddMinutes(-30)
        });

        dbContext.SocialMatches.Add(match);
        await dbContext.SaveChangesAsync();
        dbContext.ChangeTracker.Clear();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new JoinMatchCommandHandler(dbContext, userContext);
        var command = new JoinMatchCommand(_matchId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldContain("đang chờ chủ phòng xét duyệt");
    }

    [Fact]
    public async Task Handle_WhenUserRejoinsCancelledMatchWithAutoApproval_ShouldUpdateParticipantAndDecrementSlots()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        await SeedDependenciesAsync(dbContext);
        var match = CreateTestMatch(_matchId, _hostId, availableSlots: 2, approvalMode: 0);
        var existingParticipant = new MatchParticipant
        {
            Id = Guid.NewGuid(),
            MatchId = _matchId,
            PlayerId = _userId,
            Status = ParticipantStatus.Cancelled,
            JoinedAt = DateTime.UtcNow.AddDays(-1)
        };
        match.Participants.Add(existingParticipant);

        dbContext.SocialMatches.Add(match);
        await dbContext.SaveChangesAsync();
        dbContext.ChangeTracker.Clear();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new JoinMatchCommandHandler(dbContext, userContext);
        var command = new JoinMatchCommand(_matchId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(existingParticipant.Id);

        var updatedMatch = await dbContext.SocialMatches
            .Include(m => m.Participants)
            .FirstAsync(m => m.Id == _matchId);

        updatedMatch.AvailableSlots.ShouldBe(1);
        var participant = updatedMatch.Participants.First(p => p.PlayerId == _userId);
        participant.Status.ShouldBe(ParticipantStatus.Confirmed);
    }

    [Fact]
    public async Task Handle_WhenUserRejoinsCancelledMatchWithHostApproval_ShouldUpdateParticipantToPendingWithoutDecrementingSlots()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        await SeedDependenciesAsync(dbContext);
        var match = CreateTestMatch(_matchId, _hostId, availableSlots: 2, approvalMode: 1);
        var existingParticipant = new MatchParticipant
        {
            Id = Guid.NewGuid(),
            MatchId = _matchId,
            PlayerId = _userId,
            Status = ParticipantStatus.Cancelled,
            JoinedAt = DateTime.UtcNow.AddDays(-1)
        };
        match.Participants.Add(existingParticipant);

        dbContext.SocialMatches.Add(match);
        await dbContext.SaveChangesAsync();
        dbContext.ChangeTracker.Clear();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new JoinMatchCommandHandler(dbContext, userContext);
        var command = new JoinMatchCommand(_matchId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(existingParticipant.Id);

        var updatedMatch = await dbContext.SocialMatches
            .Include(m => m.Participants)
            .FirstAsync(m => m.Id == _matchId);

        updatedMatch.AvailableSlots.ShouldBe(2); // Not decremented
        var participant = updatedMatch.Participants.First(p => p.PlayerId == _userId);
        participant.Status.ShouldBe(ParticipantStatus.PendingApproval);
    }

    [Fact]
    public async Task Handle_WhenNewUserJoinsWithAutoApproval_ShouldAddConfirmedParticipantAndDecrementSlots()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        await SeedDependenciesAsync(dbContext);
        var match = CreateTestMatch(_matchId, _hostId, availableSlots: 3, approvalMode: 0);
        dbContext.SocialMatches.Add(match);
        await dbContext.SaveChangesAsync();
        dbContext.ChangeTracker.Clear();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new JoinMatchCommandHandler(dbContext, userContext);
        var command = new JoinMatchCommand(_matchId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldNotBe(Guid.Empty);

        var updatedMatch = await dbContext.SocialMatches
            .Include(m => m.Participants)
            .FirstAsync(m => m.Id == _matchId);

        updatedMatch.AvailableSlots.ShouldBe(2);
        var newParticipant = updatedMatch.Participants.FirstOrDefault(p => p.PlayerId == _userId);
        newParticipant.ShouldNotBeNull();
        newParticipant.Status.ShouldBe(ParticipantStatus.Confirmed);
    }

    [Fact]
    public async Task Handle_WhenNewUserJoinsWithHostApproval_ShouldAddPendingParticipantWithoutDecrementingSlots()
    {
        // Arrange
        await using var dbContext = CreateDbContext();
        await SeedDependenciesAsync(dbContext);
        var match = CreateTestMatch(_matchId, _hostId, availableSlots: 3, approvalMode: 1);
        dbContext.SocialMatches.Add(match);
        await dbContext.SaveChangesAsync();
        dbContext.ChangeTracker.Clear();

        var userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(_userId);

        var handler = new JoinMatchCommandHandler(dbContext, userContext);
        var command = new JoinMatchCommand(_matchId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldNotBe(Guid.Empty);

        var updatedMatch = await dbContext.SocialMatches
            .Include(m => m.Participants)
            .FirstAsync(m => m.Id == _matchId);

        updatedMatch.AvailableSlots.ShouldBe(3);
        var newParticipant = updatedMatch.Participants.FirstOrDefault(p => p.PlayerId == _userId);
        newParticipant.ShouldNotBeNull();
        newParticipant.Status.ShouldBe(ParticipantStatus.PendingApproval);
    }

    private async Task SeedDependenciesAsync(TestDbContext dbContext)
    {
        var player = new ApplicationUser
        {
            Id = _userId,
            FullName = "Người chơi",
            PhoneNumber = "0900000001",
            Email = "player@test.com"
        };
        var host = new ApplicationUser
        {
            Id = _hostId,
            FullName = "Chủ kèo",
            PhoneNumber = "0900000002",
            Email = "host@test.com"
        };
        var branch = new Branch
        {
            Id = _branchId,
            CourtOwnerId = Guid.NewGuid(),
            Name = "CLB Giao Lưu",
            Province = "Hồ Chí Minh",
            District = "Quận 1",
            Street = "123 Lê Lợi",
            Hotline = "0901234567",
            AccountNumber = "123456789",
            AccountName = "NGUYEN VAN A",
            OpenTime = new TimeOnly(6, 0),
            CloseTime = new TimeOnly(23, 0)
        };
        var sportType = new SportType
        {
            Id = _sportTypeId,
            Name = "Cầu Lông"
        };
        var order = new Order
        {
            Id = _orderId,
            BranchId = _branchId,
            PlayerId = _hostId,
            Status = OrderStatus.Confirmed,
            Channel = OrderChannel.Online,
            OrderCode = "ORD-TEST-MCH",
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CustomerName = "Host",
            CustomerPhone = "0900000002",
            OrderType = OrderType.Normal,
            HoldExpiresAt = DateTime.UtcNow.AddHours(2)
        };

        dbContext.Users.AddRange(player, host);
        dbContext.Branches.Add(branch);
        dbContext.SportTypes.Add(sportType);
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();
    }

    private SocialMatch CreateTestMatch(Guid matchId, Guid hostId, int availableSlots, byte approvalMode)
    {
        return new SocialMatch
        {
            Id = matchId,
            OrderId = _orderId,
            BranchId = _branchId,
            SportTypeId = _sportTypeId,
            HostId = hostId,
            Date = DateOnly.FromDateTime(DateTime.Today.AddDays(1)),
            StartTime = new TimeOnly(18, 0),
            EndTime = new TimeOnly(20, 0),
            MissingPlayers = availableSlots,
            AvailableSlots = availableSlots,
            FeePerPlayer = 50000m,
            ApprovalMode = approvalMode,
            SkillLevel = "Cơ bản",
            CreatedAt = DateTime.UtcNow,
            Participants = []
        };
    }
}
