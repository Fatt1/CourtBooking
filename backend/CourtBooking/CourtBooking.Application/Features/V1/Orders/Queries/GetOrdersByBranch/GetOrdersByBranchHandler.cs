using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Orders.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Orders.Queries.GetOrdersByBranch;

public sealed class GetOrdersByBranchHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : IQueryHandler<GetOrdersByBranchQuery, PagedList<OrderDto>>
{
    public async Task<Result<PagedList<OrderDto>>> Handle(
        GetOrdersByBranchQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu / quản lý chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<PagedList<OrderDto>>(authResult.Error!);
        }

        // 2. Base Query lọc theo chi nhánh và loại đơn vãng lai (mặc định Normal)
        var targetOrderType = request.OrderType ?? OrderType.Normal;
        var query = dbContext.Orders
            .AsNoTracking()
            .Where(o => o.BranchId == request.BranchId && o.OrderType == targetOrderType);

        // 3. Áp dụng các bộ lọc
        if (request.Status.HasValue)
        {
            query = query.Where(o => o.Status == request.Status.Value);
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(o => o.OrderDate >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(o => o.OrderDate <= request.ToDate.Value);
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

        // 5. Phân trang và chiếu trực tiếp sang DTO
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new OrderDto(
                o.Id,
                o.OrderCode,
                o.CustomerName,
                o.CustomerPhone,
                o.Status,
                o.OrderType,
                o.OrderDate,
                o.TotalAmount,
                o.Note,
                o.Details.Select(d => new OrderDetailDto(
                    d.CourtId,
                    d.Court.Name,
                    d.Date,
                    d.StartTime,
                    d.EndTime)).ToList()))
            .ToListAsync(cancellationToken);

        var pagedList = new PagedList<OrderDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedList<OrderDto>>.Success(pagedList);
    }
}
