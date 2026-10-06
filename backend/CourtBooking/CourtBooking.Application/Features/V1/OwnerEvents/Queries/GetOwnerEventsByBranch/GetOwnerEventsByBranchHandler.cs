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

        // 3. Áp dụng các bộ lọc động
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
            query = query.Where(e => e.Date == request.Date.Value);
        }
        else
        {
            if (request.FromDate.HasValue)
            {
                query = query.Where(e => e.Date >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                query = query.Where(e => e.Date <= request.ToDate.Value);
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
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.StartTime)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(e => new
            {
                e.Id,
                e.Order.OrderCode,
                e.Title,
                e.SportTypeId,
                SportTypeName = e.SportType.Name,
                Courts = e.Order.Details.Select(d => new CourtSummaryDto(d.CourtId, d.Court.Name)).Distinct().ToList(),
                e.Date,
                e.StartTime,
                e.EndTime,
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
            x.SportTypeId,
            x.SportTypeName,
            x.Courts,
            string.Join(", ", x.Courts.Select(c => c.CourtName)),
            x.Date,
            x.StartTime,
            x.EndTime,
            x.Slots,
            x.SoldTickets,
            x.AvailableSlot,
            x.TicketPrice,
            x.EstimatedRevenue,
            x.Status,
            x.Description,
            x.SkillLevelFrom,
            x.SkillLevelTo
        )).ToList();

        var pagedList = new PagedList<OwnerEventItemDto>(items, totalCount, request.Page, request.PageSize);
        return Result.Success(pagedList);
    }
}
