using Application.UnitTests.Abstractions;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Orders.Commands.ConfirmOrder;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Orders;

public sealed class ConfirmOrderCommandHandlerTests : BaseHandlerTest
{
    private static readonly Guid SampleOrderId = Guid.NewGuid();
    private static readonly Guid SampleBranchId = Guid.NewGuid();

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenOrderDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        IBranchAuthorizationService branchAuth = Substitute.For<IBranchAuthorizationService>();

        var handler = new ConfirmOrderCommandHandler(context, branchAuth);
        var command = new ConfirmOrderCommand(SampleOrderId);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<NotFoundError>();
    }

    [Fact]
    public async Task Handle_Should_ReturnForbidden_WhenUserIsNotBranchOwner()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOrderAsync(context, SampleOrderId, OrderStatus.PendingConfirmation);

        IBranchAuthorizationService branchAuth = Substitute.For<IBranchAuthorizationService>();
        branchAuth.IsOwnerAsync(SampleBranchId, Arg.Any<CancellationToken>())
            .Returns(false);

        var handler = new ConfirmOrderCommandHandler(context, branchAuth);
        var command = new ConfirmOrderCommand(SampleOrderId);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ForbiddenError>();
    }

    [Fact]
    public async Task Handle_Should_ConfirmOrderSuccessfully_WhenUserIsBranchOwner()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOrderAsync(context, SampleOrderId, OrderStatus.PendingConfirmation);

        IBranchAuthorizationService branchAuth = Substitute.For<IBranchAuthorizationService>();
        branchAuth.IsOwnerAsync(SampleBranchId, Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new ConfirmOrderCommandHandler(context, branchAuth);
        var command = new ConfirmOrderCommand(SampleOrderId);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        Order order = await context.Orders.SingleAsync(o => o.Id == SampleOrderId);
        order.Status.ShouldBe(OrderStatus.Confirmed);
    }

    private static async Task SeedOrderAsync(TestDbContext context, Guid orderId, OrderStatus status)
    {
        var order = new Order
        {
            Id = orderId,
            OrderCode = "ORD-TEST-002",
            BranchId = SampleBranchId,
            CustomerName = "Nguyen Van Test",
            CustomerPhone = "0901234567",
            Status = status,
            Channel = OrderChannel.Online,
            OrderType = OrderType.Normal,
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            HoldExpiresAt = DateTime.UtcNow.AddMinutes(15)
        };

        context.Orders.Add(order);
        await context.SaveChangesAsync();
    }
}
