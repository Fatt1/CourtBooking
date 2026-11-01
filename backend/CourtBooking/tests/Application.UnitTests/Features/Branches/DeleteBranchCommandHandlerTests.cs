using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Branches.Commands.DeleteBranch;
using CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Branches;

public sealed class DeleteBranchCommandHandlerTests : BaseHandlerTest
{
    private readonly IUserContext _userContext = Substitute.For<IUserContext>();
    private readonly IPublisher _publisher = Substitute.For<IPublisher>();

    [Fact]
    public async Task Handle_WhenBranchNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        _userContext.UserId.Returns(Guid.NewGuid());

        var handler = new DeleteBranchHandler(context, _userContext, _publisher);
        var command = new DeleteBranchCommand(Guid.NewGuid());

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

        var branch = new BranchBuilder().WithCourtOwnerId(ownerId).Build();
        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var handler = new DeleteBranchHandler(context, _userContext, _publisher);
        var command = new DeleteBranchCommand(branch.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenOwnerHasOnlyOneBranch_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerId = Guid.NewGuid();
        _userContext.UserId.Returns(ownerId);

        var branch = new BranchBuilder().WithCourtOwnerId(ownerId).Build();
        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var handler = new DeleteBranchHandler(context, _userContext, _publisher);
        var command = new DeleteBranchCommand(branch.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
        Assert.Contains("ít nhất một chi nhánh", result.Error.Message);
    }

    [Fact]
    public async Task Handle_WhenBranchHasOrders_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerId = Guid.NewGuid();
        _userContext.UserId.Returns(ownerId);

        var branch1 = new BranchBuilder().WithCourtOwnerId(ownerId).Build();
        var branch2 = new BranchBuilder().WithCourtOwnerId(ownerId).Build();
        await context.Branches.AddRangeAsync(branch1, branch2);

        var order = new OrderBuilder().WithBranchId(branch1.Id).Build();
        await context.Orders.AddAsync(order);
        await context.SaveChangesAsync();

        var handler = new DeleteBranchHandler(context, _userContext, _publisher);
        var command = new DeleteBranchCommand(branch1.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
        Assert.Contains("dữ liệu đơn đặt sân", result.Error.Message);
    }

    [Fact]
    public async Task Handle_WhenValid_DeletesBranchAndPublishesDeleteImagesEvent()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerId = Guid.NewGuid();
        _userContext.UserId.Returns(ownerId);

        var branch1 = new BranchBuilder().WithCourtOwnerId(ownerId).Build();
        var branch2 = new BranchBuilder().WithCourtOwnerId(ownerId).Build();
        await context.Branches.AddRangeAsync(branch1, branch2);
        await context.SaveChangesAsync();

        var handler = new DeleteBranchHandler(context, _userContext, _publisher);
        var command = new DeleteBranchCommand(branch1.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        var remaining = await context.Branches.ToListAsync();
        Assert.Single(remaining);
        Assert.Equal(branch2.Id, remaining[0].Id);

        await _publisher.Received(1).Publish(Arg.Any<DeleteImagesEvent>(), Arg.Any<CancellationToken>());
    }
}
