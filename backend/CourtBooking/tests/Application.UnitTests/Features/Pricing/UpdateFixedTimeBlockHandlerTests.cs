using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.UpdateFixedTimeBlock;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Pricing;

public sealed class UpdateFixedTimeBlockHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();

    [Fact]
    public async Task Handle_WhenBranchAuthFails_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();
        var blockId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Không có quyền")));

        var handler = new UpdateFixedTimeBlockHandler(context, _branchAuth);
        var command = new UpdateFixedTimeBlockCommand(
            branchId, blockId, new TimeOnly(17, 30), new TimeOnly(19, 30), [0, 6], [Guid.CreateVersion7()]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenBlockNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();
        var blockId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdateFixedTimeBlockHandler(context, _branchAuth);
        var command = new UpdateFixedTimeBlockCommand(
            branchId, blockId, new TimeOnly(17, 30), new TimeOnly(19, 30), [0, 6], [Guid.CreateVersion7()]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenBlockBelongsToDifferentBranch_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerBranchId = Guid.CreateVersion7();
        var otherBranchId = Guid.CreateVersion7();

        var courtType = new CourtTypeBuilder().WithBranchId(otherBranchId).Build();
        var block = new FixedTimeBlock
        {
            Id = Guid.CreateVersion7(),
            CourtTypeId = courtType.Id,
            StartTime = new TimeOnly(17, 0),
            EndTime = new TimeOnly(19, 0),
            DaysOfWeekMask = 1
        };

        await context.CourtTypes.AddAsync(courtType);
        await context.FixedTimeBlocks.AddAsync(block);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(ownerBranchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdateFixedTimeBlockHandler(context, _branchAuth);
        var command = new UpdateFixedTimeBlockCommand(
            ownerBranchId, block.Id, new TimeOnly(17, 30), new TimeOnly(19, 30), [0, 6], [Guid.CreateVersion7()]);

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
        var block = new FixedTimeBlock
        {
            Id = Guid.CreateVersion7(),
            CourtTypeId = courtType.Id,
            StartTime = new TimeOnly(17, 0),
            EndTime = new TimeOnly(19, 0),
            DaysOfWeekMask = 1
        };
        var courtInOtherType = new CourtBuilder().WithCourtTypeId(otherCourtType.Id).Build();

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddRangeAsync(courtType, otherCourtType);
        await context.FixedTimeBlocks.AddAsync(block);
        await context.Courts.AddAsync(courtInOtherType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdateFixedTimeBlockHandler(context, _branchAuth);
        var command = new UpdateFixedTimeBlockCommand(
            branchId, block.Id, new TimeOnly(17, 30), new TimeOnly(19, 30), [0, 6], [courtInOtherType.Id]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<BadError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenOverlapWithAnotherBlockOnSameCourt_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var branch = new BranchBuilder().WithId(branchId).Build();
        var courtType = new CourtTypeBuilder().WithBranchId(branchId).Build();
        var court = new CourtBuilder().WithCourtTypeId(courtType.Id).WithName("Sân 1").Build();

        var blockToUpdate = new FixedTimeBlock
        {
            Id = Guid.CreateVersion7(),
            CourtTypeId = courtType.Id,
            StartTime = new TimeOnly(6, 0),
            EndTime = new TimeOnly(8, 0),
            DaysOfWeekMask = 65, // Sat, Sun
            Courts = [new FixedTimeBlockCourt { CourtId = court.Id }]
        };

        var anotherBlock = new FixedTimeBlock
        {
            Id = Guid.CreateVersion7(),
            CourtTypeId = courtType.Id,
            StartTime = new TimeOnly(17, 0),
            EndTime = new TimeOnly(20, 0),
            DaysOfWeekMask = 65, // Sat, Sun
            Courts = [new FixedTimeBlockCourt { CourtId = court.Id }]
        };

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.Courts.AddAsync(court);
        await context.FixedTimeBlocks.AddRangeAsync(blockToUpdate, anotherBlock);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdateFixedTimeBlockHandler(context, _branchAuth);
        // Updating blockToUpdate to 18:00 - 19:30 on Sunday (0) -> Overlaps with anotherBlock on court
        var command = new UpdateFixedTimeBlockCommand(
            branchId, blockToUpdate.Id, new TimeOnly(18, 0), new TimeOnly(19, 30), [0], [court.Id]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValidCommand_UpdatesFixedTimeBlockAndCourtsSuccessfully()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var branch = new BranchBuilder().WithId(branchId).Build();
        var courtType = new CourtTypeBuilder().WithBranchId(branchId).Build();
        var court1 = new CourtBuilder().WithCourtTypeId(courtType.Id).WithName("Sân 1").Build();
        var court2 = new CourtBuilder().WithCourtTypeId(courtType.Id).WithName("Sân 2").Build();
        var court3 = new CourtBuilder().WithCourtTypeId(courtType.Id).WithName("Sân 3").Build();

        var block = new FixedTimeBlock
        {
            Id = Guid.CreateVersion7(),
            CourtTypeId = courtType.Id,
            StartTime = new TimeOnly(6, 0),
            EndTime = new TimeOnly(8, 0),
            DaysOfWeekMask = 65,
            Courts = [new FixedTimeBlockCourt { CourtId = court1.Id }, new FixedTimeBlockCourt { CourtId = court2.Id }]
        };

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.Courts.AddRangeAsync(court1, court2, court3);
        await context.FixedTimeBlocks.AddAsync(block);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdateFixedTimeBlockHandler(context, _branchAuth);
        var newStartTime = new TimeOnly(18, 0);
        var newEndTime = new TimeOnly(20, 0);
        // Switch courts to [court2, court3], Days to [1, 2, 3] -> mask = 2 | 4 | 8 = 14
        var command = new UpdateFixedTimeBlockCommand(
            branchId, block.Id, newStartTime, newEndTime, [1, 2, 3], [court2.Id, court3.Id]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        var updatedBlock = await context.FixedTimeBlocks
            .Include(b => b.Courts)
            .FirstOrDefaultAsync(b => b.Id == block.Id);

        Assert.NotNull(updatedBlock);
        Assert.Equal(newStartTime, updatedBlock.StartTime);
        Assert.Equal(newEndTime, updatedBlock.EndTime);
        Assert.Equal(14, updatedBlock.DaysOfWeekMask);
        Assert.Equal(2, updatedBlock.Courts.Count);
        Assert.DoesNotContain(updatedBlock.Courts, c => c.CourtId == court1.Id);
        Assert.Contains(updatedBlock.Courts, c => c.CourtId == court2.Id);
        Assert.Contains(updatedBlock.Courts, c => c.CourtId == court3.Id);
    }
}
