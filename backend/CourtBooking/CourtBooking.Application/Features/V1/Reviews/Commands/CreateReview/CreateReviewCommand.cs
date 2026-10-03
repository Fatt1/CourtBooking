using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Reviews.Commands.CreateReview;

public sealed record CreateReviewCommand(
    Guid OrderId,
    byte Rating,
    string? Comment) : ICommand<Guid>;
