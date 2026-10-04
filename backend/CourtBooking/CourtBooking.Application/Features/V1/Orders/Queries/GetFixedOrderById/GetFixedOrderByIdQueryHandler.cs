using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Features.V1.Orders.Dtos;
using CourtBooking.Application.Helpers;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetFixedOrderById;

public sealed class GetFixedOrderByIdQueryHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : IQueryHandler<GetFixedOrderByIdQuery, FixedOrderResponse>
{
    public async Task<Result<FixedOrderResponse>> Handle(
        GetFixedOrderByIdQuery request,
        CancellationToken cancellationToken)
    {
        var order = await dbContext.Orders
            .AsNoTracking()
            .AsSplitQuery()
            .Include(o => o.Branch)
            .Include(o => o.PaymentTransactions)
            .Include(o => o.Services)
                .ThenInclude(s => s.Service)
            .Include(o => o.Details)
                .ThenInclude(d => d.Court)
                    .ThenInclude(c => c.CourtType)
            .Include(o => o.FixedConfigs)
                .ThenInclude(f => f.Courts)
                    .ThenInclude(c => c.Court)
                        .ThenInclude(c => c.CourtType)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result.Failure<FixedOrderResponse>(new NotFoundError("Order", request.OrderId.ToString()));
        }

        if (order.OrderType != OrderType.Fixed)
        {
            return Result.Failure<FixedOrderResponse>(new BadError("Đơn hàng này không phải là đơn lịch cố định."));
        }

        var isOwner = await branchAuth.IsOwnerAsync(order.BranchId, cancellationToken);
        if (!isOwner)
        {
            return Result.Failure<FixedOrderResponse>(new ForbiddenError("Bạn không có quyền truy cập đơn hàng này."));
        }


        var cycles = order.FixedConfigs.Select(f =>
        {
            var firstCourt = f.Courts.FirstOrDefault()?.Court;
            var courtTypeId = firstCourt?.CourtTypeId ?? Guid.Empty;
            var courtTypeName = firstCourt?.CourtType?.Name ?? string.Empty;

            return new FixedCycleDetailDto(
                CycleId: f.Id,
                CourtTypeId: courtTypeId,
                CourtTypeName: courtTypeName,
                StartDate: f.StartDate,
                EndDate: f.EndDate,
                DaysOfWeekMask: f.DaysOfWeekMask,
                DaysOfWeek: DaysOfWeekMaskHelper.DecodeMask(f.DaysOfWeekMask),
                DayNames: DaysOfWeekMaskHelper.DecodeMaskToNames(f.DaysOfWeekMask),
                StartTime: f.StartTime,
                EndTime: f.EndTime,
                ExceptionDates: FixedCycleHelper.ParseExceptionDates(f.ExceptionDates),
                Courts: f.Courts.Select(c => new FixedCycleCourtItemDto(
                    c.CourtId,
                    c.Court.Name
                )).ToList()
            );
        }).ToList();

        var slots = order.Details
            .OrderBy(d => d.Date)
            .ThenBy(d => d.StartTime)
            .Select(od => new FixedOrderSlotDto(
                OrderDetailId: od.Id,
                CourtId: od.CourtId,
                CourtName: od.Court.Name,
                CourtTypeId: od.Court.CourtTypeId,
                CourtTypeName: od.Court.CourtType.Name,
                Date: od.Date,
                StartTime: od.StartTime,
                EndTime: od.EndTime,
                Price: od.Price
            )).ToList();

        var services = order.Services.Select(s => new FixedOrderServiceDto(
            ServiceId: s.ServiceId,
            ServiceName: s.Service.Name,
            Unit: s.Service.Unit,
            UnitPrice: s.UnitPrice,
            Quantity: s.Quantity,
            TotalPrice: s.Quantity * s.UnitPrice
        )).ToList();

        var transactions = order.PaymentTransactions
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new PaymentTransactionDto(
                Id: t.Id,
                Amount: t.Amount,
                PaymentMethod: t.Method,
                Type: t.Type,
                CreatedAt: t.CreatedAt,
                ImageKey: t.ProofImage == null ? null : t.ProofImage.StorageKey

            )).ToList();

        var response = new FixedOrderResponse(
            Id: order.Id,
            OrderCode: order.OrderCode,
            BranchId: order.BranchId,
            BranchName: order.Branch.Name,
            Channel: order.Channel,
            Status: order.Status,
            OrderType: order.OrderType,
            OrderDate: order.OrderDate,
            CreatedAt: order.CreatedAt,
            Note: order.Note,
            CancelReason: order.CancelReason,
            CustomerName: order.CustomerName,
            CustomerPhone: order.CustomerPhone,
            PlayerId: order.PlayerId,
            Cycles: cycles,
            Slots: slots,
            Services: services,
            TotalCourtAmount: order.TotalCourtAmount,
            TotalServiceAmount: order.TotalServiceAmount,
            DiscountAmount: order.DiscountAmount,
            TotalAmount: order.TotalAmount,
            RemainingAmount: order.CalculateRemainingAmount(),
            PaymentTransactions: transactions
        );

        return Result<FixedOrderResponse>.Success(response);
    }
}
