using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.CreateFixedTimeBlock;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Pricing;

public sealed class CreateFixedTimeBlockHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();

    [Fact]
    public async Task Handle_WhenBranchAuthFails_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();
        var courtTypeId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Không có quyền")));

        var handler = new CreateFixedTimeBlockHandler(context, _branchAuth);
        var command = new CreateFixedTimeBlockCommand(
            branchId, courtTypeId, new TimeOnly(17, 30), new TimeOnly(19, 30), [0, 6], [Guid.CreateVersion7()]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenCourtTypeNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();
        var courtTypeId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateFixedTimeBlockHandler(context, _branchAuth);
        var command = new CreateFixedTimeBlockCommand(
            branchId, courtTypeId, new TimeOnly(17, 30), new TimeOnly(19, 30), [0, 6], [Guid.CreateVersion7()]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenCourtTypeBelongsToDifferentBranch_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerBranchId = Guid.CreateVersion7();
        var otherBranchId = Guid.CreateVersion7();

        var courtType = new CourtTypeBuilder().WithBranchId(otherBranchId).Build();
        await context.CourtTypes.AddAsync(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(ownerBranchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateFixedTimeBlockHandler(context, _branchAuth);
        var command = new CreateFixedTimeBlockCommand(
            ownerBranchId, courtType.Id, new TimeOnly(17, 30), new TimeOnly(19, 30), [0, 6], [Guid.CreateVersion7()]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenCourtIdsDoNotBelongToCourtType_ReturnsBadRequest()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var branch = new BranchBuilder().WithId(branchId).Build();
        var courtType = new CourtTypeBuilder().WithBranchId(branchId).Build();
        var otherCourtType = new CourtTypeBuilder().WithBranchId(branchId).Build();
        var courtInOtherType = new CourtBuilder().WithCourtTypeId(otherCourtType.Id).Build();

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddRangeAsync(courtType, otherCourtType);
        await context.Courts.AddAsync(courtInOtherType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateFixedTimeBlockHandler(context, _branchAuth);
        var command = new CreateFixedTimeBlockCommand(
            branchId, courtType.Id, new TimeOnly(17, 30), new TimeOnly(19, 30), [0, 6], [courtInOtherType.Id]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<BadError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenOverlapOnAssignedCourt_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var branch = new BranchBuilder().WithId(branchId).Build();
        var courtType = new CourtTypeBuilder().WithBranchId(branchId).Build();
        var court = new CourtBuilder().WithCourtTypeId(courtType.Id).WithName("Sân 1").Build();

        // Existing block on Saturday (6) and Sunday (0), mask = (1<<0) | (1<<6) = 1 | 64 = 65
        // Time: 17:30 - 19:30
        var existingBlock = new FixedTimeBlock
        {
            Id = Guid.CreateVersion7(),
            CourtTypeId = courtType.Id,
            StartTime = new TimeOnly(17, 30),
            EndTime = new TimeOnly(19, 30),
            DaysOfWeekMask = 65,
            Courts = [new FixedTimeBlockCourt { CourtId = court.Id }]
        };

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.Courts.AddAsync(court);
        await context.FixedTimeBlocks.AddAsync(existingBlock);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateFixedTimeBlockHandler(context, _branchAuth);
        // Overlapping command: Saturday (6), Time: 18:00 - 20:00 on the same court
        var command = new CreateFixedTimeBlockCommand(
            branchId, courtType.Id, new TimeOnly(18, 0), new TimeOnly(20, 0), [6], [court.Id]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValidCommand_CreatesFixedTimeBlockAndReturnsId()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var branch = new BranchBuilder().WithId(branchId).Build();
        var courtType = new CourtTypeBuilder().WithBranchId(branchId).Build();
        var court1 = new CourtBuilder().WithCourtTypeId(courtType.Id).WithName("Sân 1").Build();
        var court2 = new CourtBuilder().WithCourtTypeId(courtType.Id).WithName("Sân 2").Build();

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.Courts.AddRangeAsync(court1, court2);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateFixedTimeBlockHandler(context, _branchAuth);
        var startTime = new TimeOnly(17, 30);
        var endTime = new TimeOnly(19, 30);
        // Saturday (6) and Sunday (0) -> mask = 65
        var command = new CreateFixedTimeBlockCommand(
            branchId, courtType.Id, startTime, endTime, [0, 6], [court1.Id, court2.Id]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotEqual(Guid.Empty, result.Value);

        var createdBlock = await context.FixedTimeBlocks
            .Include(b => b.Courts)
            .FirstOrDefaultAsync(b => b.Id == result.Value);

        Assert.NotNull(createdBlock);
        Assert.Equal(courtType.Id, createdBlock.CourtTypeId);
        Assert.Equal(startTime, createdBlock.StartTime);
        Assert.Equal(endTime, createdBlock.EndTime);
        Assert.Equal(65, createdBlock.DaysOfWeekMask);
        Assert.Equal(2, createdBlock.Courts.Count);
        Assert.Contains(createdBlock.Courts, c => c.CourtId == court1.Id);
        Assert.Contains(createdBlock.Courts, c => c.CourtId == court2.Id);
    }
}
