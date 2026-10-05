using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Courts.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Courts.Queries.GetCourtsByBranch;

public sealed record GetCourtsByBranchQuery(
    Guid BranchId,
    Guid? CourtTypeId = null,
    CourtStatus? Status = null,
    string? Search = null) : IQuery<IReadOnlyList<CourtDto>>;

internal sealed class GetCourtsByBranchHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth)
    : IQueryHandler<GetCourtsByBranchQuery, IReadOnlyList<CourtDto>>
{
    public async Task<Result<IReadOnlyList<CourtDto>>> Handle(
        GetCourtsByBranchQuery request,
        CancellationToken cancellationToken)
    {
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<IReadOnlyList<CourtDto>>(authResult.Error!);
        }

        var courtsQuery = dbContext.Courts
            .AsNoTracking()
            .Include(c => c.CourtType)
            .ThenInclude(ct => ct.Branch)
            .Where(c => c.CourtType.BranchId == request.BranchId);

        if (request.CourtTypeId.HasValue)
        {
            courtsQuery = courtsQuery.Where(c => c.CourtTypeId == request.CourtTypeId.Value);
        }

        if (request.Status.HasValue)
        {
            courtsQuery = courtsQuery.Where(c => c.Status == request.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            courtsQuery = courtsQuery.Where(c => c.Name.ToLower().Contains(search));
        }

        var courts = await courtsQuery
            .OrderBy(c => c.Name)
            .Select(c => new CourtDto
            {
                Id = c.Id,
                CourtTypeId = c.CourtTypeId,
                CourtTypeName = c.CourtType.Name,
                BranchId = c.CourtType.BranchId,
                BranchName = c.CourtType.Branch.Name,
                Name = c.Name,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<CourtDto>>(courts);
    }
}
