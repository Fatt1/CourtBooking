using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Services.Commands.DeleteService;

internal sealed class DeleteServiceHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth,
    IPublisher publisher) : ICommandHandler<DeleteServiceCommand>
{
    public async Task<Result> Handle(
        DeleteServiceCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Tải Service cùng danh sách chi nhánh
        var service = await dbContext.Services
            .Include(s => s.Branches)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId, cancellationToken);

        if (service is null)
        {
            return Result.Failure(new NotFoundError("Service", request.ServiceId));
        }

        // 2. Kiểm tra quyền sở hữu các chi nhánh qua IBranchAuthorizationService
        if (service.Branches.Count > 0)
        {
            var authResult = await branchAuth.EnsureOwnerOfAllAsync(
                service.Branches.Select(b => b.BranchId),
                cancellationToken);

            if (authResult.IsFailure)
            {
                return authResult;
            }
        }

        // 3. Kiểm tra xem dịch vụ có trong BẤT KỲ đơn hàng nào không
        var hasAnyOrdersGlobal = await dbContext.OrderServices
            .AnyAsync(os => os.ServiceId == request.ServiceId, cancellationToken)
            || await dbContext.RetailOrderItems
            .AnyAsync(roi => roi.ServiceId == request.ServiceId, cancellationToken);

        if (hasAnyOrdersGlobal)
        {
            return Result.Failure(new ConflictError("Không thể xóa dịch vụ vì đã có đơn hàng sử dụng dịch vụ này."));
        }

        // 4. Xóa bảng nối trước vì quan hệ ServiceBranch dùng DeleteBehavior.NoAction
        dbContext.ServiceBranches.RemoveRange(service.Branches);
        dbContext.Services.Remove(service);
        await dbContext.SaveChangesAsync(cancellationToken);

        if (service.ImageId.HasValue)
        {
            await publisher.Publish(new DeleteImagesEvent([service.ImageId.Value]), cancellationToken);
        }

        return Result.Success();
    }
}
