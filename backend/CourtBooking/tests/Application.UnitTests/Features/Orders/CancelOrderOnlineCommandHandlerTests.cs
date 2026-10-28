using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderOnline;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Orders;

public sealed class CancelOrderOnlineCommandHandlerTests : BaseHandlerTest
{
    private static readonly Guid SampleOrderId = Guid.NewGuid();
    private static readonly Guid SampleBranchId = Guid.NewGuid();

    [Fact]
    public async Task Handle_WhenOrderDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new CancelOrderOnlineCommandHandler(context);
        var command = new CancelOrderOnlineCommand(SampleOrderId, "Lý do hủy");

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenOrderIsAlreadyCancelled_ReturnsSuccess()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var order = new OrderBuilder()
            .WithId(SampleOrderId)
            .WithBranchId(SampleBranchId)
            .WithStatus(OrderStatus.Cancelled)
            .Build();
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = new CancelOrderOnlineCommandHandler(context);
        var command = new CancelOrderOnlineCommand(SampleOrderId, "Lý do hủy");

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task Handle_WhenStatusIsAwaitingPayment_CancelsOrderImmediately()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var order = new OrderBuilder()
            .WithId(SampleOrderId)
            .WithBranchId(SampleBranchId)
            .WithStatus(OrderStatus.AwaitingPayment)
            .Build();
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = new CancelOrderOnlineCommandHandler(context);
        var command = new CancelOrderOnlineCommand(SampleOrderId, "Khách hàng đổi ý");

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        Order updatedOrder = await context.Orders.SingleAsync(o => o.Id == SampleOrderId);
        Assert.Equal(OrderStatus.Cancelled, updatedOrder.Status);
        Assert.Equal("Khách hàng đổi ý", updatedOrder.CancelReason);
    }

    [Fact]
    public async Task Handle_WhenStatusIsConfirmed_SetsStatusToRequestCancellation()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var order = new OrderBuilder()
            .WithId(SampleOrderId)
            .WithBranchId(SampleBranchId)
            .WithStatus(OrderStatus.Confirmed)
            .Build();
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = new CancelOrderOnlineCommandHandler(context);
        var command = new CancelOrderOnlineCommand(SampleOrderId, "Bận việc đột xuất");

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        Order updatedOrder = await context.Orders.SingleAsync(o => o.Id == SampleOrderId);
        Assert.Equal(OrderStatus.RequestCancellation, updatedOrder.Status);
        Assert.Equal("Bận việc đột xuất", updatedOrder.CancelReason);
    }

    [Fact]
    public async Task Handle_WhenOrderIsAlreadyInRequestCancellation_ReturnsFailure()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var order = new OrderBuilder()
            .WithId(SampleOrderId)
            .WithBranchId(SampleBranchId)
            .WithStatus(OrderStatus.RequestCancellation)
            .Build();
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = new CancelOrderOnlineCommandHandler(context);
        var command = new CancelOrderOnlineCommand(SampleOrderId, "Lại yêu cầu hủy");

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.NotNull(result.Error);
        Assert.Contains("đang chờ chủ sân duyệt", result.Error.Message);
    }

    [Fact]
    public async Task Handle_WhenOrderStatusIsCompleted_ReturnsFailure()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var order = new OrderBuilder()
            .WithId(SampleOrderId)
            .WithBranchId(SampleBranchId)
            .WithStatus(OrderStatus.Completed)
            .Build();
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var handler = new CancelOrderOnlineCommandHandler(context);
        var command = new CancelOrderOnlineCommand(SampleOrderId, "Hủy đơn sau khi hoàn thành");

        // Act
        Result result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.NotNull(result.Error);
        Assert.Contains("Không thể hủy đơn hàng ở trạng thái hiện tại", result.Error.Message);
    }
}
