using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Branches.Commands.UpdateBranchStatus;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Branches;

public sealed class UpdateBranchStatusCommandHandlerTests : BaseHandlerTest
{
    private readonly IUserContext _userContext = Substitute.For<IUserContext>();

    [Fact]
    public async Task Handle_WhenBranchNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        _userContext.UserId.Returns(Guid.NewGuid());

        var handler = new UpdateBranchStatusHandler(context, _userContext);
        var command = new UpdateBranchStatusCommand(Guid.NewGuid(), false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenBranchNotOwnedByUser_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        _userContext.UserId.Returns(otherUserId);

        var branch = new BranchBuilder().WithCourtOwnerId(ownerId).WithActive(true).Build();
        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var handler = new UpdateBranchStatusHandler(context, _userContext);
        var command = new UpdateBranchStatusCommand(branch.Id, false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValid_UpdatesIsActiveSuccessfully()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerId = Guid.NewGuid();
        _userContext.UserId.Returns(ownerId);

        var branch = new BranchBuilder().WithCourtOwnerId(ownerId).WithActive(true).Build();
        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var handler = new UpdateBranchStatusHandler(context, _userContext);
        var command = new UpdateBranchStatusCommand(branch.Id, false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        var updated = await context.Branches.FirstOrDefaultAsync(b => b.Id == branch.Id);
        Assert.NotNull(updated);
        Assert.False(updated.IsActive);
    }
}
