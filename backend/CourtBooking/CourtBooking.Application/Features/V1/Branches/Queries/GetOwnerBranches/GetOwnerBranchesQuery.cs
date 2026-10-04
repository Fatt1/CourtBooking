using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranches;

public sealed record GetOwnerBranchesQuery : IQuery<IReadOnlyList<OwnerBranchListItemDto>>;
