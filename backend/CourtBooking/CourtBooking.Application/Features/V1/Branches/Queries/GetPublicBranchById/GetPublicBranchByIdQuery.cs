using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetPublicBranchById;

public sealed record GetPublicBranchByIdQuery(Guid Id) : IQuery<PublicBranchDetailDto>;
