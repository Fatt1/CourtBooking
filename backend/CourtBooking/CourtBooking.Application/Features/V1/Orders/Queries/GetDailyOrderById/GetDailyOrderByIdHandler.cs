using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetDailyOrderById;

public class GetDailyOrderByIdHandler : IQueryHandler<GetDailyOrderByIdQuery, DailyOrderResponse>
{
    private readonly IApplicationDbContext _dbContext;
    private readonly IBranchAuthorizationService _branchAuthorizationService;

    public GetDailyOrderByIdHandler(IApplicationDbContext dbContext, IBranchAuthorizationService branchAuthorizationService)
    {
        _dbContext = dbContext;
        _branchAuthorizationService = branchAuthorizationService;
    }

    public async Task<Result<DailyOrderResponse>> Handle(GetDailyOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders
            .Include(o => o.PaymentTransactions)
            .AsNoTracking()
            .Where(o => o.Id == request.OrderId)
            .Select(o => new DailyOrderResponse(
                Id: o.Id,
                OrderCode: o.OrderCode,
                BranchId: o.BranchId,
                BranchName: o.Branch.Name,
                Channel: o.Channel,
                Status: o.Status,
                OrderType: o.OrderType,
                OrderDate: o.OrderDate,
                CreatedAt: o.CreatedAt,
                HoldExpiresAt: o.HoldExpiresAt,
                Note: o.Note,
                CancelReason: o.CancelReason,
                CustomerName: o.CustomerName,
                CustomerPhone: o.CustomerPhone,
                PlayerId: o.PlayerId,
                Slots: o.Details.Select(od => new DailyOrderSlotItemDto(
                    OrderDetailId: od.Id,
                    CourtId: od.CourtId,
                    CourtName: od.Court.Name,
                    CourtTypeName: od.Court.CourtType.Name,
                    Date: od.Date,
                    StartTime: od.StartTime,
                    EndTime: od.EndTime,
                    Price: od.Price
                )).ToList(),
                Services: o.Services.Select(s => new DailyOrderServiceItemDto(
                    ServiceId: s.ServiceId,
                    ServiceName: s.Service.Name,
                    Unit: s.Service.Unit,
                    UnitPrice: s.UnitPrice,
                    Quantity: s.Quantity,
                    TotalPrice: s.Quantity * s.UnitPrice
                )).ToList(),
                TotalCourtAmount: o.TotalCourtAmount,
                TotalServiceAmount: o.TotalServiceAmount,
                DiscountAmount: o.DiscountAmount,
                TotalAmount: o.TotalAmount,
                RemainingAmount: o.CalculateRemainingAmount()
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (order == null)
        {
            return Result.Failure<DailyOrderResponse>(new NotFoundError("Order", request.OrderId.ToString()));
        }

        var isOwner = await _branchAuthorizationService.IsOwnerAsync(order.BranchId, cancellationToken);
        if (!isOwner)
        {
            return Result.Failure<DailyOrderResponse>(new ForbiddenError("Bạn không có quyền truy cập đơn hàng này."));
        }

        return Result<DailyOrderResponse>.Success(order);
    }
}
