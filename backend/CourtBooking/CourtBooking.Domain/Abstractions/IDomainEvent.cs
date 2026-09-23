using MediatR;
namespace CourtBooking.Domain.Abstractions;

public interface IDomainEvent : INotification
{
    DateTimeOffset OccurredAt { get; }
}
