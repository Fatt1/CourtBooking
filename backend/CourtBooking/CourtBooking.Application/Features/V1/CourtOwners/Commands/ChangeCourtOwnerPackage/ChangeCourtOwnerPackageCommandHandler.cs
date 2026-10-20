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

        // Quy tắc: Tạo bản ghi thuê bao mới trong lịch sử đăng ký của Chủ sân để lưu vết giao dịch đổi gói
        var endDate = currentSub is not null && currentSub.EndDate > today
            ? currentSub.EndDate
            : today.AddMonths(newPackage.DurationMonths);

        var subscription = new CourtOwnerSubscription
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = request.CourtOwnerId,
            ServicePackageId = newPackage.Id,
            PricePaid = newPackage.Price,
            StartDate = today,
            EndDate = endDate,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.CourtOwnerSubscriptions.Add(subscription);

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
