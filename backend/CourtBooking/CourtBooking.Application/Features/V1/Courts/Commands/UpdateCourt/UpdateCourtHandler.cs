using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Courts.Commands.UpdateCourt;

internal sealed class UpdateCourtHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth)
    : ICommandHandler<UpdateCourtCommand>
{
    public async Task<Result> Handle(
        UpdateCourtCommand request,
        CancellationToken cancellationToken)
    {
        var court = await dbContext.Courts
            .Include(c => c.CourtType)
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);

        if (court is null)
        {
            return Result.Failure(new NotFoundError("Court", request.Id));
        }

        var authResult = await branchAuth.EnsureOwnerAsync(court.CourtType.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return authResult;
        }

        var targetCourtTypeId = request.CourtTypeId ?? court.CourtTypeId;

        // Nếu chuyển sang loại sân khác, kiểm tra loại sân đích có thuộc cùng chi nhánh không
        if (targetCourtTypeId != court.CourtTypeId)
        {
            var targetCourtType = await dbContext.CourtTypes
                .FirstOrDefaultAsync(ct => ct.Id == targetCourtTypeId && ct.BranchId == court.CourtType.BranchId, cancellationToken);

            if (targetCourtType is null)
            {
                return Result.Failure(new NotFoundError("Target CourtType was not found in this branch.", targetCourtTypeId));
            }

            court.CourtTypeId = targetCourtTypeId;
        }

        var normalizedName = request.Name.Trim();

        var nameExists = await dbContext.Courts
            .AnyAsync(c => c.CourtTypeId == targetCourtTypeId
                        && c.Id != court.Id
                        && c.Name.ToLower() == normalizedName.ToLower(), cancellationToken);

        if (nameExists)
        {
            return Result.Failure(new ConflictError($"Tên sân '{normalizedName}' đã tồn tại trong loại sân này."));
        }

        court.Name = normalizedName;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
