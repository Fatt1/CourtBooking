using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServicePackages.Queries.GetOwnerSubscriptionMe;

internal sealed class GetOwnerSubscriptionMeQueryHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetOwnerSubscriptionMeQuery, OwnerSubscriptionMeResponse>
{
    public async Task<Result<OwnerSubscriptionMeResponse>> Handle(GetOwnerSubscriptionMeQuery request, CancellationToken ct)
    {
        var ownerId = userContext.UserId;

        // 1. Lấy thông tin tài khoản chủ sân kèm gói dịch vụ nhúng trực tiếp
        var owner = await dbContext.CourtOwners
            .Include(co => co.User)
            .Include(co => co.ServicePackage)
            .AsNoTracking()
            .FirstOrDefaultAsync(co => co.Id == ownerId, ct);

        // 2. Lấy toàn bộ lịch sử thuê bao của chủ sân
        var allSubs = await dbContext.CourtOwnerSubscriptions
            .Include(s => s.ServicePackage)
            .AsNoTracking()
            .Where(s => s.CourtOwnerId == ownerId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(ct);

        // 3. Xác định gói cước hiện tại trực tiếp từ trường nhúng trên CourtOwner (không dùng fallback)
        SubscriptionDto? currentSubDto = null;
        if (owner?.ServicePackage is not null && owner.PackageStartDate.HasValue && owner.PackageEndDate.HasValue)
        {
            currentSubDto = new SubscriptionDto(
                owner.ServicePackage.Id,
                owner.ServicePackage.Id,
                owner.ServicePackage.Name,
                owner.ServicePackage.Price,
                owner.PackageStartDate.Value,
                owner.PackageEndDate.Value);
        }

        // 4. Map danh sách lịch sử gói dịch vụ tinh gọn (không có trạng thái)
        var fullName = owner?.User.FullName ?? "Chủ sân";
        var businessName = owner?.BusinessName ?? "Cụm sân";

        var historyList = allSubs.Select(s => new SubscriptionHistoryItemDto(
            s.Id,
            s.CourtOwnerId,
            fullName,
            businessName,
            s.ServicePackage.Name,
            s.PricePaid,
            s.StartDate,
            s.EndDate,
            s.CreatedAt)).ToList();

        return Result.Success(new OwnerSubscriptionMeResponse(currentSubDto, historyList));
    }
}
