using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetOneTimeBooking;

public sealed record GetOneTimeBookingQuery(
    Guid BranchId,
    DateOnly Date) : IQuery<OneTimeBookingScheduleDto>;
