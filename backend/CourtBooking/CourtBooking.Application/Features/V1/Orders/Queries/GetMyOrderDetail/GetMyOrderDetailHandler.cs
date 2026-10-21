using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetMyOrderDetail;

public sealed class GetMyOrderDetailHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetMyOrderDetailQuery, MyOrderDetailResponse>
{
    public async Task<Result<MyOrderDetailResponse>> Handle(
        GetMyOrderDetailQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = userContext.UserId;

        var order = await dbContext.Orders
            .AsSplitQuery()
            .AsNoTracking()
            .Include(o => o.Branch)
                .ThenInclude(b => b.BranchSportTypes)
                    .ThenInclude(bst => bst.SportType)
            .Include(o => o.Branch)
                .ThenInclude(b => b.QrImage)
            .Include(o => o.Details)
                .ThenInclude(d => d.Court)
                    .ThenInclude(c => c.CourtType)
            .Include(o => o.Services)
                .ThenInclude(s => s.Service)
            .Include(o => o.SocialMatch)
            .Include(o => o.Reviews)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId && o.PlayerId == currentUserId, cancellationToken);

        if (order == null)
        {
            return Result.Failure<MyOrderDetailResponse>(new NotFoundError("Order", request.OrderId));
        }

        var sportType = order.Branch.BranchSportTypes.FirstOrDefault()?.SportType;

        var firstDetail = order.Details
            .OrderBy(d => d.Date)
            .ThenBy(d => d.StartTime)
            .FirstOrDefault();

        var date = firstDetail?.Date ?? order.OrderDate;
        var startTime = firstDetail?.StartTime ?? new TimeOnly(0, 0);
        var matchStartTime = date.ToDateTime(startTime);
        var hasSocialMatch = order.SocialMatch != null;
        var canCreateMatch = order.Status == OrderStatus.Confirmed && !hasSocialMatch && matchStartTime > DateTime.Now;
        var canPay = order.Status == OrderStatus.AwaitingPayment && order.HoldExpiresAt > DateTime.UtcNow;

        var review = order.Reviews.FirstOrDefault();

        var slots = order.Details
            .OrderBy(d => d.Date)
            .ThenBy(d => d.StartTime)
            .Select(d => new MyOrderDetailSlotItemDto(
                d.Id,
                d.CourtId,
                d.Court?.Name ?? "Sân",
                d.Court?.CourtTypeId,
                d.Court?.CourtType?.Name,
                d.Date,
                d.StartTime,
                d.EndTime,
                d.Price))
            .ToList();

        var services = order.Services
            .Select(s => new MyOrderDetailServiceItemDto(
                s.ServiceId,
                s.Service?.Name ?? "Dịch vụ",
                s.Service?.Unit ?? "Cái",
                s.UnitPrice,
                s.Quantity,
                s.UnitPrice * s.Quantity))
            .ToList();

        var response = new MyOrderDetailResponse(
            order.Id,
            order.OrderCode,
            order.BranchId,
            order.Branch.Name,
            order.Branch.GetFullAddress(),
            order.Branch.Hotline,
            sportType?.Name,
            order.Status,
            order.OrderType,
            order.Channel,
            order.CreatedAt,
            order.HoldExpiresAt,
            order.Note,
            order.CancelReason,
            order.CustomerName,
            order.CustomerPhone,
            order.TotalCourtAmount,
            order.TotalServiceAmount,
            order.DiscountAmount,
            order.TotalAmount,
            canPay,
            order.Branch.AccountNumber,
            order.Branch.AccountName,
            order.Branch.QrImage?.StorageKey,
            hasSocialMatch,
            order.SocialMatch?.Id,
            canCreateMatch,
            review != null,
            review?.Rating,
            review?.Comment,
            slots,
            services);

        return Result<MyOrderDetailResponse>.Success(response);
    }
}
