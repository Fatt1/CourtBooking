using Application.UnitTests.Abstractions;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Orders.Commands.CompleteOrder;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Payments;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Orders;

public sealed class CompleteOrderCommandHandlerTests : BaseHandlerTest
{
    private static readonly Guid SampleOrderId = Guid.NewGuid();
    private static readonly Guid SampleBranchId = Guid.NewGuid();

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenOrderDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        IBranchAuthorizationService branchAuth = Substitute.For<IBranchAuthorizationService>();

        var handler = new CompleteOrderCommandHandler(context, branchAuth);
        var command = new CompleteOrderCommand(SampleOrderId);

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
        await SeedOrderAsync(context, SampleOrderId, OrderStatus.Confirmed, totalAmount: 100_000m, paidAmount: 100_000m);

        IBranchAuthorizationService branchAuth = Substitute.For<IBranchAuthorizationService>();
        branchAuth.IsOwnerAsync(SampleBranchId, Arg.Any<CancellationToken>())
            .Returns(false);

        var handler = new CompleteOrderCommandHandler(context, branchAuth);
        var command = new CompleteOrderCommand(SampleOrderId);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ForbiddenError>();
    }

    [Fact]
    public async Task Handle_Should_ReturnBadError_WhenOrderIsAlreadyCompleted()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOrderAsync(context, SampleOrderId, OrderStatus.Completed, totalAmount: 100_000m, paidAmount: 100_000m);

        IBranchAuthorizationService branchAuth = Substitute.For<IBranchAuthorizationService>();
        branchAuth.IsOwnerAsync(SampleBranchId, Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new CompleteOrderCommandHandler(context, branchAuth);
        var command = new CompleteOrderCommand(SampleOrderId);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldNotBeNull();
        result.Error.Message.ShouldContain("Đơn hàng đã hoàn thành trước đó");
    }

    [Fact]
    public async Task Handle_Should_ReturnBadError_WhenOrderIsNotConfirmed()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOrderAsync(context, SampleOrderId, OrderStatus.AwaitingPayment, totalAmount: 100_000m, paidAmount: 100_000m);

        IBranchAuthorizationService branchAuth = Substitute.For<IBranchAuthorizationService>();
        branchAuth.IsOwnerAsync(SampleBranchId, Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new CompleteOrderCommandHandler(context, branchAuth);
        var command = new CompleteOrderCommand(SampleOrderId);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldNotBeNull();
        result.Error.Message.ShouldContain("Chỉ có thể hoàn thành đơn hàng ở trạng thái đã xác nhận");
    }

    [Fact]
    public async Task Handle_Should_ReturnBadError_WhenOrderHasUnpaidRemainingAmount()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOrderAsync(context, SampleOrderId, OrderStatus.Confirmed, totalAmount: 200_000m, paidAmount: 100_000m);

        IBranchAuthorizationService branchAuth = Substitute.For<IBranchAuthorizationService>();
        branchAuth.IsOwnerAsync(SampleBranchId, Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new CompleteOrderCommandHandler(context, branchAuth);
        var command = new CompleteOrderCommand(SampleOrderId);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldNotBeNull();
        result.Error.Message.ShouldContain("chưa thanh toán đủ");
    }

    [Fact]
    public async Task Handle_Should_CompleteOrderSuccessfully_WhenOrderIsConfirmedAndFullyPaid()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOrderAsync(context, SampleOrderId, OrderStatus.Confirmed, totalAmount: 150_000m, paidAmount: 150_000m);

        IBranchAuthorizationService branchAuth = Substitute.For<IBranchAuthorizationService>();
        branchAuth.IsOwnerAsync(SampleBranchId, Arg.Any<CancellationToken>())
            .Returns(true);

        var handler = new CompleteOrderCommandHandler(context, branchAuth);
        var command = new CompleteOrderCommand(SampleOrderId);

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        Order order = await context.Orders.SingleAsync(o => o.Id == SampleOrderId);
        order.Status.ShouldBe(OrderStatus.Completed);
    }

    private static async Task SeedOrderAsync(TestDbContext context, Guid orderId, OrderStatus status, decimal totalAmount, decimal paidAmount)
    {
        var order = new Order
        {
            Id = orderId,
            OrderCode = "ORD-TEST-003",
            BranchId = SampleBranchId,
            CustomerName = "Nguyen Van Test",
            CustomerPhone = "0901234567",
            Status = status,
            Channel = OrderChannel.Online,
            OrderType = OrderType.Normal,
            OrderDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            TotalCourtAmount = totalAmount,
            HoldExpiresAt = DateTime.UtcNow.AddMinutes(15)
        };

        if (paidAmount > 0)
        {
            order.PaymentTransactions.Add(new PaymentTransaction
            {
                Id = Guid.NewGuid(),
                OrderId = orderId,
                Amount = paidAmount,
                Method = PaymentMethod.QrTransfer,
                Type = PaymentTransactionType.Payment,
                CreatedAt = DateTime.UtcNow
            });
        }

        context.Orders.Add(order);
        await context.SaveChangesAsync();
    }
}
