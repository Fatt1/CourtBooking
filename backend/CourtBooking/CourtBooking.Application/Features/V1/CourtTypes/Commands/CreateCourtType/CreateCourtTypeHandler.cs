using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.CourtTypes.Commands.CreateCourtType;

internal sealed class CreateCourtTypeHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth)
    : ICommandHandler<CreateCourtTypeCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateCourtTypeCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<Guid>(authResult.Error!);
        }

        var normalizedName = request.Name.Trim();

        // 2. Kiểm tra trùng tên loại sân trong cùng chi nhánh
        var existingNames = await dbContext.CourtTypes
            .AsNoTracking()
            .Where(ct => ct.BranchId == request.BranchId)
            .Select(ct => ct.Name)
            .ToListAsync(cancellationToken);

        var nameAlreadyExists = existingNames.Any(name =>
            string.Equals(name, normalizedName, StringComparison.OrdinalIgnoreCase));

        if (nameAlreadyExists)
        {
            return Result.Failure<Guid>(
                new ConflictError("Tên loại sân đã tồn tại trong chi nhánh này."));
        }

        // 3. Khởi tạo và lưu loại sân mới
        var courtType = new CourtType
        {
            Id = Guid.CreateVersion7(),
            BranchId = request.BranchId,
            Name = normalizedName,
            MinutesConfig = request.MinutesConfig
        };

        await dbContext.CourtTypes.AddAsync(courtType, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(courtType.Id);
    }
}
