using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Services.Queries.GetServicesByBranch;

public sealed record GetServicesByBranchQuery(
    Guid BranchId,
    string? SearchTerm = null,
    Guid? CategoryId = null,
    bool? IsActive = null
    ) : IQuery<List<ServiceByBranchDto>>;



