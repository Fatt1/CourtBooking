using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.CourtOwners.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Subscriptions;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.CourtOwners.Commands.ExtendCourtOwnerSubscription;

internal sealed class ExtendCourtOwnerSubscriptionCommandHandler(
    IApplicationDbContext dbContext) : ICommandHandler<ExtendCourtOwnerSubscriptionCommand, CourtOwnerSubscriptionDetailDto>
{
    public async Task<Result<CourtOwnerSubscriptionDetailDto>> Handle(ExtendCourtOwnerSubscriptionCommand request, CancellationToken ct)
    {
        // 1. Kiểm tra Chủ sân tồn tại
        var courtOwner = await dbContext.CourtOwners
            .FirstOrDefaultAsync(co => co.Id == request.CourtOwnerId, ct);

        if (courtOwner is null)
        {
            return Result.Failure<CourtOwnerSubscriptionDetailDto>(new NotFoundError("CourtOwner", request.CourtOwnerId));
        }

        // 2. Lấy thông tin thuê bao gần nhất của Chủ sân
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var latestSub = await dbContext.CourtOwnerSubscriptions
            .Include(s => s.ServicePackage)
            .Where(s => s.CourtOwnerId == request.CourtOwnerId)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);

        CourtOwnerSubscription subscription;
        ServicePackage targetPackage;

        // Quy tắc: Gia hạn nối tiếp từ ngày hết hạn hoặc từ hôm nay nếu gói đã hết hạn.
        if (latestSub is not null && latestSub.EndDate >= today)
        {
            // Trường hợp 1: Gói còn hạn -> Gia hạn nối tiếp từ ngày hết hạn hiện tại
            latestSub.EndDate = latestSub.EndDate.AddMonths(request.DurationMonths);
            subscription = latestSub;
            targetPackage = latestSub.ServicePackage;
        }
        else
        {
            // Trường hợp 2: Gói đã hết hạn hoặc chưa từng đăng ký -> Gia hạn tính từ hôm nay
            targetPackage = latestSub?.ServicePackage
                ?? await dbContext.ServicePackages.FirstOrDefaultAsync(ct)
                ?? throw new InvalidOperationException("Hệ thống chưa có gói dịch vụ nào.");

            subscription = new CourtOwnerSubscription
            {
                Id = Guid.NewGuid(),
                CourtOwnerId = request.CourtOwnerId,
                ServicePackageId = targetPackage.Id,
                PricePaid = targetPackage.Price * request.DurationMonths,
                StartDate = today,
                EndDate = today.AddMonths(request.DurationMonths),
                CreatedAt = DateTime.UtcNow
            };

            dbContext.CourtOwnerSubscriptions.Add(subscription);
        }

        await dbContext.SaveChangesAsync(ct);

        return Result.Success(new CourtOwnerSubscriptionDetailDto(
            subscription.Id,
            request.CourtOwnerId,
            targetPackage.Id,
            targetPackage.Name,
            subscription.StartDate,
            subscription.EndDate,
            subscription.IsActive));
    }
}
