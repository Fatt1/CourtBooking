using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServicePackages.Commands.DeleteServicePackage;

internal sealed class DeleteServicePackageCommandHandler(IApplicationDbContext dbContext)
    : ICommandHandler<DeleteServicePackageCommand>
{
    public async Task<Result> Handle(DeleteServicePackageCommand request, CancellationToken ct)
    {
        var package = await dbContext.ServicePackages
            .FirstOrDefaultAsync(p => p.Id == request.Id, ct);

        if (package is null)
        {
            return Result.Failure(new NotFoundError("ServicePackage", request.Id));
        }

        var hasSubscriptions = await dbContext.CourtOwnerSubscriptions
            .AnyAsync(s => s.ServicePackageId == request.Id, ct);

        if (hasSubscriptions)
        {
            return Result.Failure(new ConflictError(
                "Không thể xóa gói dịch vụ đang có chủ sân đăng ký sử dụng."));
        }

        dbContext.ServicePackages.Remove(package);
        await dbContext.SaveChangesAsync(ct);

        return Result.Success();
    }
}
