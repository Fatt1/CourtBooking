using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.CourtOwners.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Subscriptions;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.CourtOwners.Commands.ChangeCourtOwnerPackage;

internal sealed class ChangeCourtOwnerPackageCommandHandler(
    IApplicationDbContext dbContext) : ICommandHandler<ChangeCourtOwnerPackageCommand, CourtOwnerSubscriptionDetailDto>
{
    public async Task<Result<CourtOwnerSubscriptionDetailDto>> Handle(ChangeCourtOwnerPackageCommand request, CancellationToken ct)
    {
        // 1. Kiểm tra Chủ sân tồn tại
        var courtOwner = await dbContext.CourtOwners
            .FirstOrDefaultAsync(co => co.Id == request.CourtOwnerId, ct);

        if (courtOwner is null)
        {
            return Result.Failure<CourtOwnerSubscriptionDetailDto>(new NotFoundError("CourtOwner", request.CourtOwnerId));
        }

        // 2. Kiểm tra Gói dịch vụ mới tồn tại
        var newPackage = await dbContext.ServicePackages
            .FirstOrDefaultAsync(p => p.Id == request.NewPackageId, ct);

        if (newPackage is null)
        {
            return Result.Failure<CourtOwnerSubscriptionDetailDto>(new NotFoundError("ServicePackage", request.NewPackageId));
        }

        // 3. Tìm thuê bao gần nhất / hiện tại của Chủ sân
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentSub = await dbContext.CourtOwnerSubscriptions
            .Include(s => s.ServicePackage)
            .Where(s => s.CourtOwnerId == request.CourtOwnerId)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);

        CourtOwnerSubscription subscription;

        // Quy tắc: Gói hiện tại sẽ được thay bằng gói mới. Ngày hết hạn hiện tại được giữ nguyên.
        if (currentSub is not null)
        {
            currentSub.ServicePackageId = newPackage.Id;
            currentSub.PricePaid = newPackage.Price;
            // EndDate giữ nguyên theo yêu cầu
            subscription = currentSub;
        }
        else
        {
            // Nếu chủ sân chưa từng có thuê bao, khởi tạo gói mới từ hôm nay
            subscription = new CourtOwnerSubscription
            {
                Id = Guid.NewGuid(),
                CourtOwnerId = request.CourtOwnerId,
                ServicePackageId = newPackage.Id,
                PricePaid = newPackage.Price,
                StartDate = today,
                EndDate = today.AddMonths(newPackage.DurationMonths),
                CreatedAt = DateTime.UtcNow
            };
            dbContext.CourtOwnerSubscriptions.Add(subscription);
        }

        await dbContext.SaveChangesAsync(ct);

        return Result.Success(new CourtOwnerSubscriptionDetailDto(
            subscription.Id,
            request.CourtOwnerId,
            newPackage.Id,
            newPackage.Name,
            subscription.StartDate,
            subscription.EndDate,
            subscription.IsActive));
    }
}
