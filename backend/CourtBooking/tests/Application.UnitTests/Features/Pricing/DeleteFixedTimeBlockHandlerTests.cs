using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.DeleteFixedTimeBlock;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Pricing;

public sealed class DeleteFixedTimeBlockHandlerTests : BaseHandlerTest
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

        var handler = new DeleteFixedTimeBlockHandler(context, _branchAuth);
        var command = new DeleteFixedTimeBlockCommand(branchId, blockId);

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

        var handler = new DeleteFixedTimeBlockHandler(context, _branchAuth);
        var command = new DeleteFixedTimeBlockCommand(branchId, blockId);

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

        var handler = new DeleteFixedTimeBlockHandler(context, _branchAuth);
        var command = new DeleteFixedTimeBlockCommand(ownerBranchId, block.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValidCommand_DeletesBlockSuccessfully()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var branch = new BranchBuilder().WithId(branchId).Build();
        var courtType = new CourtTypeBuilder().WithBranchId(branchId).Build();
        var court = new CourtBuilder().WithCourtTypeId(courtType.Id).Build();
        var block = new FixedTimeBlock
        {
            Id = Guid.CreateVersion7(),
            CourtTypeId = courtType.Id,
            StartTime = new TimeOnly(17, 0),
            EndTime = new TimeOnly(19, 0),
            DaysOfWeekMask = 1,
            Courts = [new FixedTimeBlockCourt { CourtId = court.Id }]
        };

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.Courts.AddAsync(court);
        await context.FixedTimeBlocks.AddAsync(block);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new DeleteFixedTimeBlockHandler(context, _branchAuth);
        var command = new DeleteFixedTimeBlockCommand(branchId, block.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        var exists = await context.FixedTimeBlocks.AnyAsync(b => b.Id == block.Id);
        Assert.False(exists);
    }
}
