using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Orders.Commands.ConfirmOrder;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Orders;

public sealed class ConfirmOrderCommandHandlerTests : BaseHandlerTest
{
    private static readonly Guid SampleOrderId = Guid.NewGuid();
    private static readonly Guid SampleBranchId = Guid.NewGuid();

    [Fact]
    public async Task Handle_WhenOrderDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        IBranchAuthorizationService branchAuth = Substitute.For<IBranchAuthorizationService>();

        var handler = new ConfirmOrderCommandHandler(context, branchAuth);
        var command = new ConfirmOrderCommand(SampleOrderId);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenUserIsNotBranchOwner_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var order = new OrderBuilder()
            .WithId(SampleOrderId)
            .WithBranchId(SampleBranchId)
            .WithStatus(OrderStatus.PendingConfirmation)
            .Build();
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        IBranchAuthorizationService branchAuth = Substitute.For<IBranchAuthorizationService>();
        branchAuth.IsOwnerAsync(SampleBranchId, Arg.Any<CancellationToken>())
            .Returns(false);

        var handler = new ConfirmOrderCommandHandler(context, branchAuth);
        var command = new ConfirmOrderCommand(SampleOrderId);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenUserIsBranchOwner_ConfirmsOrderSuccessfully()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var order = new OrderBuilder()
            .WithId(SampleOrderId)
            .WithBranchId(SampleBranchId)
            .WithStatus(OrderStatus.PendingConfirmation)
            .Build();
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        IBranchAuthorizationService branchAuth = Substitute.For<IBranchAuthorizationService>();
        branchAuth.IsOwnerAsync(SampleBranchId, Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new ConfirmOrderCommandHandler(context, branchAuth);
        var command = new ConfirmOrderCommand(SampleOrderId);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        Order updatedOrder = await context.Orders.SingleAsync(o => o.Id == SampleOrderId);
        Assert.Equal(OrderStatus.Confirmed, updatedOrder.Status);
    }
}
