using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServicePackages.Queries.GetSubscriptionHistory;

internal sealed class GetSubscriptionHistoryQueryHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetSubscriptionHistoryQuery, SubscriptionHistoryResponse>
{
    public async Task<Result<SubscriptionHistoryResponse>> Handle(GetSubscriptionHistoryQuery request, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var warningDate = today.AddDays(7); // Cảnh báo trước 7 ngày hết hạn theo giao diện

        // 1. Đếm tổng số lượng thuê bao sắp hết hạn trong 7 ngày tới (để hiển thị badge trên tab)
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

        // 4. Lọc theo trạng thái
        if (!string.IsNullOrWhiteSpace(request.Status) && !request.Status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = request.Status.ToLowerInvariant() switch
            {
                "expiringsoon" => query.Where(s => s.CourtOwner.User.Status == UserStatus.Active
                                                && s.EndDate >= today
                                                && s.EndDate <= warningDate),
                "active" => query.Where(s => s.CourtOwner.User.Status == UserStatus.Active
                                          && s.StartDate <= today
                                          && s.EndDate > warningDate),
                "expired" => query.Where(s => s.EndDate < today),
                "suspended" => query.Where(s => s.CourtOwner.User.Status != UserStatus.Active),
                _ => query
            };
        }

        // 5. Phân trang
        var totalCount = await query.CountAsync(ct);

        var rawItems = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(ct);

        // 6. Map sang DTO
        var mappedItems = rawItems.Select(s =>
        {
            string status;
            if (s.CourtOwner.User.Status != UserStatus.Active)
            {
                status = "Suspended"; // Tạm dừng
            }
            else if (s.EndDate < today)
            {
                status = "Expired"; // Hết hạn
            }
            else if (s.EndDate <= warningDate)
            {
                status = "ExpiringSoon"; // Sắp hết hạn (còn <= 7 ngày)
            }
            else
            {
                status = "Active"; // Hoạt động bình thường
            }

            int daysRemaining = Math.Max(0, s.EndDate.DayNumber - today.DayNumber);
            string initials = GetAvatarInitials(s.CourtOwner.User.FullName);
            string transactionCode = $"PAY-{s.CreatedAt:yyMMdd}-{s.Id.ToString()[..3].ToUpperInvariant()}";

            return new SubscriptionHistoryItemDto(
                s.Id,
                s.CourtOwnerId,
                s.CourtOwner.User.FullName,
                s.CourtOwner.BusinessName,
                initials,
                s.ServicePackage.Name,
                s.PricePaid,
                s.StartDate,
                s.EndDate,
                transactionCode,
                status,
                daysRemaining);
        }).ToList();

        var pagedList = new PagedList<SubscriptionHistoryItemDto>(
            mappedItems,
            totalCount,
            request.Page,
            request.PageSize);

        return Result.Success(new SubscriptionHistoryResponse(pagedList, expiringSoonCount));
    }

    private static string GetAvatarInitials(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return "CS";
        }

        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 1)
        {
            return parts[0][..Math.Min(2, parts[0].Length)].ToUpperInvariant();
        }

        return $"{parts[0][0]}{parts[^1][0]}".ToUpperInvariant();
    }
}
