using MediatR;

namespace CourtBooking.Application.Features.V1.Orders.Events.RequestedOrder;

public sealed record RequestedOrderEvent(
    Guid OrderId,
    string OrderCode,
    Guid BranchId,
    string BranchName,
    Guid CourtOwnerId,
    string CustomerName,
    string CustomerPhone,
    decimal TotalAmount,
    DateTime CreatedAt
) : INotification;
