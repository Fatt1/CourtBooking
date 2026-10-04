using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Orders.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetFixedOrdersByBranch;

public sealed class GetFixedOrdersByBranchHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : IQueryHandler<GetFixedOrdersByBranchQuery, PagedList<FixedOrderDto>>
{
    public async Task<Result<PagedList<FixedOrderDto>>> Handle(
        GetFixedOrdersByBranchQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu / quản lý chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<PagedList<FixedOrderDto>>(authResult.Error!);
        }

        // 2. Base Query lọc đơn cố định (OrderType.Fixed) theo chi nhánh
        var query = dbContext.Orders
            .Include(o => o.PaymentTransactions)
            .AsNoTracking()
            .Where(o => o.BranchId == request.BranchId && o.OrderType == OrderType.Fixed);

        // 3. Bộ lọc
        if (request.Status.HasValue)
        {
            query = query.Where(o => o.Status == request.Status.Value);
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(o => o.FixedConfigs.Any(c => c.EndDate >= request.FromDate.Value));
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(o => o.FixedConfigs.Any(c => c.StartDate <= request.ToDate.Value));
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim();
            query = query.Where(o => o.CustomerPhone.Contains(term)
                                  || o.OrderCode.Contains(term)
                                  || o.CustomerName.Contains(term));
        }

        // 4. Đếm tổng số bản ghi
        var totalCount = await query.CountAsync(cancellationToken);

        // 5. Phân trang và tải dữ liệu các chu kì
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Include(o => o.FixedConfigs)
            .ToListAsync(cancellationToken);

        // 6. Ánh xạ sang DTO chỉ gồm ngày bắt đầu và ngày kết thúc của chu kì
        var items = orders.Select(o => new FixedOrderDto(
            o.Id,
            o.OrderCode,
            o.CustomerName,
            o.CustomerPhone,
            o.Status,
            o.OrderType,
            o.OrderDate,
            o.TotalAmount,
            o.TotalCourtAmount,
            o.TotalServiceAmount,
            o.CalculateRemainingAmount(),
            o.DiscountAmount,
            o.Note,
            o.CreatedAt,
            o.FixedConfigs.Select(f => new FixedOrderCycleSummaryDto(
                f.StartTime,
                f.EndTime,
                f.Id,
                f.StartDate,
                f.EndDate)).ToList()
        )).ToList();

        var pagedList = new PagedList<FixedOrderDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedList<FixedOrderDto>>.Success(pagedList);
    }
}
