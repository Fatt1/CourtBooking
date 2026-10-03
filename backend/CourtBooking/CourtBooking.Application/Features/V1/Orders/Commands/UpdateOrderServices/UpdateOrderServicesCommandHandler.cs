using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Commands.UpdateOrderServices;

public sealed class UpdateOrderServicesCommandHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuthorizationService,
    IOrderChecker bookingValidator) : ICommandHandler<UpdateOrderServicesCommand>
{
    public async Task<Result> Handle(UpdateOrderServicesCommand request, CancellationToken cancellationToken)
    {
        // 1. Tải đơn hàng cùng danh sách dịch vụ hiện tại
        var order = await dbContext.Orders
            .Include(o => o.Services)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result.Failure(new NotFoundError("Order", request.OrderId));
        }

        // 2. Kiểm tra quyền sở hữu chi nhánh
        var isAuthorized = await branchAuthorizationService.IsOwnerAsync(order.BranchId, cancellationToken);
        if (!isAuthorized)
        {
            return Result.Failure(new ForbiddenError("Bạn không có quyền cập nhật đơn hàng này."));
        }

        // 3. Kiểm tra trạng thái đơn hàng
        if (order.Status == OrderStatus.Cancelled)
        {
            return Result.Failure(new BadError("Không thể cập nhật dịch vụ cho đơn hàng đã bị hủy."));
        }

        if (order.Status == OrderStatus.Completed)
        {
            return Result.Failure(new BadError("Không thể cập nhật dịch vụ cho đơn hàng đã hoàn thành."));
        }

        // 4. Xác thực danh sách dịch vụ mới với chi nhánh và lấy bảng giá
        var serviceValidationResult = await bookingValidator.ValidateServicesAsync(
            order.BranchId,
            request.Services,
            cancellationToken);

        if (serviceValidationResult.IsFailure)
        {
            return Result.Failure(serviceValidationResult.Error!);
        }

        var serviceBranches = serviceValidationResult.Value;

        // 5. Xóa toàn bộ dịch vụ cũ và thêm danh sách dịch vụ mới
        dbContext.OrderServices.RemoveRange(order.Services);
        order.ClearOrderServices();

        if (request.Services != null && request.Services.Count > 0)
        {
            foreach (var s in request.Services)
            {
                var sb = serviceBranches.First(item => item.ServiceId == s.ServiceId);
                order.AddOrderService(s.ServiceId, sb.Price, s.Quantity);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
