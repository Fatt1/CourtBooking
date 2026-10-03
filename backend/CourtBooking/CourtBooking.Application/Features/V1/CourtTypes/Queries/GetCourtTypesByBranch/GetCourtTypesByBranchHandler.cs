using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.CourtTypes.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.CourtTypes.Queries.GetCourtTypesByBranch;

internal sealed class GetCourtTypesByBranchHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth)
    : IQueryHandler<GetCourtTypesByBranchQuery, IReadOnlyList<CourtTypeDto>>
{
    public async Task<Result<IReadOnlyList<CourtTypeDto>>> Handle(
        GetCourtTypesByBranchQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu của chủ sân với chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<IReadOnlyList<CourtTypeDto>>(authResult.Error!);
        }

        // 2. Lấy danh sách loại sân theo BranchId
        var courtTypes = await dbContext.CourtTypes
            .AsNoTracking()
            .Where(ct => ct.BranchId == request.BranchId)
            .OrderBy(ct => ct.Name)
            .Select(ct => new CourtTypeDto(
                ct.Id,
                ct.BranchId,
                ct.Name,
                ct.MinutesConfig))
            .ToListAsync(cancellationToken);

        return Result.Success<IReadOnlyList<CourtTypeDto>>(courtTypes);
    }
}
