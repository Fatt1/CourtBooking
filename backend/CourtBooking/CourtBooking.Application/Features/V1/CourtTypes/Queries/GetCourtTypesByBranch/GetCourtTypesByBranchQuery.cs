using CourtBooking.Application.Features.V1.CourtTypes.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.CourtTypes.Queries.GetCourtTypesByBranch;

public sealed record GetCourtTypesByBranchQuery(Guid BranchId)
    : IQuery<IReadOnlyList<CourtTypeDto>>;
