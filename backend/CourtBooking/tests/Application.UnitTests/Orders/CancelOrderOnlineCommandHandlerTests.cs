using Application.UnitTests.Abstractions;
using CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderOnline;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Orders;

public sealed class CancelOrderOnlineCommandHandlerTests : BaseHandlerTest
{
    private static readonly Guid SampleOrderId = Guid.NewGuid();
    private static readonly Guid SampleBranchId = Guid.NewGuid();

    [Fact]
    public async Task Handle_Should_ReturnNotFound_WhenOrderDoesNotExist()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new CancelOrderOnlineCommandHandler(context);
        var command = new CancelOrderOnlineCommand(SampleOrderId, "Lý do hủy");

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<NotFoundError>();
    }

    [Fact]
    public async Task Handle_Should_ReturnSuccess_WhenOrderIsAlreadyCancelled()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOrderAsync(context, SampleOrderId, OrderStatus.Cancelled);

        var handler = new CancelOrderOnlineCommandHandler(context);
        var command = new CancelOrderOnlineCommand(SampleOrderId, "Lý do hủy");

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task Handle_Should_CancelOrderImmediately_WhenStatusIsAwaitingPayment()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOrderAsync(context, SampleOrderId, OrderStatus.AwaitingPayment);

        var handler = new CancelOrderOnlineCommandHandler(context);
        var command = new CancelOrderOnlineCommand(SampleOrderId, "Khách hàng đổi ý");

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        Order order = await context.Orders.SingleAsync(o => o.Id == SampleOrderId);
        order.Status.ShouldBe(OrderStatus.Cancelled);
        order.CancelReason.ShouldBe("Khách hàng đổi ý");
    }

    [Fact]
    public async Task Handle_Should_SetStatusToRequestCancellation_WhenStatusIsConfirmed()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOrderAsync(context, SampleOrderId, OrderStatus.Confirmed);

        var handler = new CancelOrderOnlineCommandHandler(context);
        var command = new CancelOrderOnlineCommand(SampleOrderId, "Bận việc đột xuất");

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();

        Order order = await context.Orders.SingleAsync(o => o.Id == SampleOrderId);
        order.Status.ShouldBe(OrderStatus.RequestCancellation);
        order.CancelReason.ShouldBe("Bận việc đột xuất");
    }

    [Fact]
    public async Task Handle_Should_ReturnFailure_WhenOrderIsAlreadyInRequestCancellation()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOrderAsync(context, SampleOrderId, OrderStatus.RequestCancellation);

        var handler = new CancelOrderOnlineCommandHandler(context);
        var command = new CancelOrderOnlineCommand(SampleOrderId, "Lại yêu cầu hủy");

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldNotBeNull();
        result.Error.Message.ShouldContain("đang chờ chủ sân duyệt");
    }

    [Fact]
    public async Task Handle_Should_ReturnFailure_WhenOrderStatusIsCompleted()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedOrderAsync(context, SampleOrderId, OrderStatus.Completed);

        var handler = new CancelOrderOnlineCommandHandler(context);
        var command = new CancelOrderOnlineCommand(SampleOrderId, "Hủy đơn sau khi hoàn thành");

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldNotBeNull();
        result.Error.Message.ShouldContain("Không thể hủy đơn hàng ở trạng thái hiện tại");
    }

    private static async Task SeedOrderAsync(TestDbContext context, Guid orderId, OrderStatus status)
    {
        var order = new Order
        {
            Id = orderId,
            OrderCode = "ORD-TEST-001",
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
