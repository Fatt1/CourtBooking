using MediatR;

namespace CourtBooking.Domain.Events;

public sealed record BranchPriceChangedEvent(Guid BranchId) : INotification;
