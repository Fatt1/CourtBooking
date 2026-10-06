using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.CourtTypes.Commands.UpdateCourtType;

internal sealed class UpdateCourtTypeHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth)
    : ICommandHandler<UpdateCourtTypeCommand>
{
    public async Task<Result> Handle(
        UpdateCourtTypeCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Tìm loại sân theo Id
        var courtType = await dbContext.CourtTypes
            .FirstOrDefaultAsync(ct => ct.Id == request.Id, cancellationToken);

        if (courtType is null)
        {
            return Result.Failure(new NotFoundError("CourtType", request.Id));
        }

        // 2. Tự động kiểm tra quyền sở hữu đối với chi nhánh của loại sân này
        var authResult = await branchAuth.EnsureOwnerAsync(courtType.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return authResult;
        }

        var normalizedName = request.Name.Trim();

        // 3. Kiểm tra trùng tên với các loại sân khác trong cùng chi nhánh
        var otherNames = await dbContext.CourtTypes
            .AsNoTracking()
            .Where(ct => ct.BranchId == courtType.BranchId && ct.Id != request.Id)
            .Select(ct => ct.Name)
            .ToListAsync(cancellationToken);

        var nameAlreadyExists = otherNames.Any(name =>
            string.Equals(name, normalizedName, StringComparison.OrdinalIgnoreCase));

        if (nameAlreadyExists)
        {
            return Result.Failure(
                new ConflictError("Tên loại sân đã tồn tại trong chi nhánh này."));
        }

        // 4. Cập nhật thông tin
        courtType.Name = normalizedName;
        courtType.MinutesConfig = request.MinutesConfig;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
