using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.OwnerEvents.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Queries.GetOwnerEventsByBranch;

internal sealed class GetOwnerEventsByBranchHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : IQueryHandler<GetOwnerEventsByBranchQuery, PagedList<OwnerEventItemDto>>
{
    public async Task<Result<PagedList<OwnerEventItemDto>>> Handle(
        GetOwnerEventsByBranchQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh của Chủ sân
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<PagedList<OwnerEventItemDto>>(authResult.Error!);
        }

        // 2. Base query: Lọc các sự kiện diễn ra tại chi nhánh
        var query = dbContext.SportEvents
            .AsNoTracking()
            .Where(e => e.Order.BranchId == request.BranchId);


        if (request.SportTypeId.HasValue)
        {
            query = query.Where(e => e.SportTypeId == request.SportTypeId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(e => e.Status == request.Status.Value);
        }

        if (request.Date.HasValue)
        {
            var dStart = request.Date.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var dEnd = request.Date.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(e => e.StartDate <= dEnd && e.EndDate >= dStart);
        }
        else
        {
            if (request.FromDate.HasValue)
            {
                var fromUtc = request.FromDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
                query = query.Where(e => e.EndDate >= fromUtc);
            }

            if (request.ToDate.HasValue)
            {
                var toUtc = request.ToDate.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
                query = query.Where(e => e.StartDate <= toUtc);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(e => e.Title.ToLower().Contains(term) || e.Order.OrderCode.ToLower().Contains(term));
        }

        // 4. Đếm tổng số bản ghi
        var totalCount = await query.CountAsync(cancellationToken);

        // 5. Phân trang và chiếu dữ liệu
        var rawItems = await query
            .OrderByDescending(e => e.StartDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(e => new
            {
                e.Id,
                e.Order.OrderCode,
                e.Title,
                Courts = e.Order.Details.Select(d => new CourtSummaryDto(d.CourtId, d.Court.Name)).Distinct().ToList(),
                e.StartDate,
                e.EndDate,
                e.Slots,
                e.AvailableSlot,
                e.TicketPrice,
                e.Status,
                e.Description,
                e.SkillLevelFrom,
                e.SkillLevelTo,
                SoldTickets = e.Tickets.Where(t => t.Status != EventTicketStatus.Cancelled).Sum(t => (int?)t.Quantity) ?? 0,
                EstimatedRevenue = e.Tickets.Where(t => t.Status == EventTicketStatus.Confirmed).Sum(t => (decimal?)(t.Price * t.Quantity)) ?? 0m
            })
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        // 6. Định dạng chuỗi tên các sân chiếm dụng
        var items = rawItems.Select(x => new OwnerEventItemDto(
            x.Id,
            x.OrderCode,
            x.Title,
            x.Courts,
            x.StartDate,
            x.EndDate,
            x.Slots,
            x.SoldTickets,
            x.AvailableSlot,
            x.TicketPrice,
            x.EstimatedRevenue,
            x.Status,
            x.SkillLevelFrom,
            x.SkillLevelTo
        )).ToList();

        var pagedList = new PagedList<OwnerEventItemDto>(items, totalCount, request.Page, request.PageSize);
        return Result.Success(pagedList);
    }
}
