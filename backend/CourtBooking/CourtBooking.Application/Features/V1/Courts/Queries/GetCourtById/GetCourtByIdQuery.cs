using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Courts.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Courts.Queries.GetCourtById;

public sealed record GetCourtByIdQuery(Guid Id) : IQuery<CourtDto>;

internal sealed class GetCourtByIdHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth)
    : IQueryHandler<GetCourtByIdQuery, CourtDto>
{
    public async Task<Result<CourtDto>> Handle(
        GetCourtByIdQuery request,
        CancellationToken cancellationToken)
    {
        var court = await dbContext.Courts
            .AsNoTracking()
            .Include(c => c.CourtType)
            .ThenInclude(ct => ct.Branch)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (court is null)
        {
            return Result.Failure<CourtDto>(new NotFoundError("Court", request.Id));
        }

        var authResult = await branchAuth.EnsureOwnerAsync(court.CourtType.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<CourtDto>(authResult.Error!);
        }

        var dto = new CourtDto
        {
            Id = court.Id,
            CourtTypeId = court.CourtTypeId,
            CourtTypeName = court.CourtType.Name,
            BranchId = court.CourtType.BranchId,
            BranchName = court.CourtType.Branch.Name,
            Name = court.Name,
            Status = court.Status
        };

        return Result.Success(dto);
    }
}
