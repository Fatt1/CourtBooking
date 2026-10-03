using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Orders.Commands.UpdateCustomerInfo;

public sealed record UpdateOrderCustomerInfoCommand(
    Guid OrderId,
    string CustomerName,
    string CustomerPhoneNumber
    ) : ICommand;

