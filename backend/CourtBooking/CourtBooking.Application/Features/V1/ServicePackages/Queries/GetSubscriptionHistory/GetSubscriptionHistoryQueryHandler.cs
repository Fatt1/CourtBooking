using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Constants;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServicePackages.Queries.GetSubscriptionHistory;

internal sealed class GetSubscriptionHistoryQueryHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetSubscriptionHistoryQuery, SubscriptionHistoryResponse>
{
    public async Task<Result<SubscriptionHistoryResponse>> Handle(GetSubscriptionHistoryQuery request, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var warningDate = today.AddDays(SubscriptionConstants.ExpiringSoonDaysWarning);

        // 1. Đếm tổng số lượng thuê bao sắp hết hạn trong 7 ngày tới (để hiển thị badge nếu cần)
        var expiringSoonCount = await dbContext.CourtOwnerSubscriptions
            .CountAsync(s => s.EndDate >= today && s.EndDate <= warningDate, ct);

        // 2. Query cơ sở kết hợp dữ liệu Chủ sân và Gói cước
        var query = dbContext.CourtOwnerSubscriptions
            .Include(s => s.CourtOwner)
                .ThenInclude(co => co.User)
            .Include(s => s.ServicePackage)
            .AsNoTracking();

        // 3. Tìm kiếm theo tên Chủ sân hoặc tên Cụm sân
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(s => s.CourtOwner.BusinessName.Contains(search)
                                  || s.CourtOwner.User.FullName.Contains(search));
        }

        // 4. Phân trang
        var totalCount = await query.CountAsync(ct);

        var rawItems = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        // 5. Map sang DTO tinh gọn
        var mappedItems = rawItems.Select(s => new SubscriptionHistoryItemDto(
            s.Id,
            s.CourtOwnerId,
            s.CourtOwner.User.FullName,
            s.CourtOwner.BusinessName,
            s.ServicePackage.Name,
            s.PricePaid,
            s.StartDate,
            s.EndDate,
            s.CreatedAt)).ToList();

        var pagedList = new PagedList<SubscriptionHistoryItemDto>(
            mappedItems,
            totalCount,
            request.Page,
            request.PageSize);

        return Result.Success(new SubscriptionHistoryResponse(pagedList, expiringSoonCount));
    }
}
