using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranchById;

public sealed record GetOwnerBranchByIdQuery(Guid Id) : IQuery<OwnerBranchDetailDto>;
