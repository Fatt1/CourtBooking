using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Subscriptions;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServicePackages.Commands.SubscribeServicePackage;

internal sealed class SubscribeServicePackageCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<SubscribeServicePackageCommand, SubscriptionDto>
{
    public async Task<Result<SubscriptionDto>> Handle(SubscribeServicePackageCommand request, CancellationToken ct)
    {
        var ownerId = userContext.UserId;

        // 1. Kiểm tra gói dịch vụ có tồn tại không
        var package = await dbContext.ServicePackages
            .FirstOrDefaultAsync(p => p.Id == request.PackageId, ct);

        if (package is null)
        {
            return Result.Failure<SubscriptionDto>(new NotFoundError("ServicePackage", request.PackageId));
        }

        // 2. Tìm thuê bao gần nhất của Chủ sân để xác định ngày nối tiếp
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var latestSub = await dbContext.CourtOwnerSubscriptions
            .Where(s => s.CourtOwnerId == ownerId)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);

        // 3. Quy tắc tính ngày theo SRS mục 1.2:
        // Nếu gói cũ còn hạn thì ngày bắt đầu của gói mới sẽ nối tiếp sau ngày kết thúc cũ.
        // Nếu chưa từng mua hoặc đã hết hạn thì tính từ hôm nay.
        DateOnly startDate = (latestSub is not null && latestSub.EndDate >= today)
            ? latestSub.EndDate.AddDays(1)
            : today;

        DateOnly endDate = startDate.AddMonths(package.DurationMonths);

        var subscription = new CourtOwnerSubscription
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = ownerId,
            ServicePackageId = package.Id,
            PricePaid = package.Price,
            StartDate = startDate,
            EndDate = endDate,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.CourtOwnerSubscriptions.Add(subscription);
        await dbContext.SaveChangesAsync(ct);

        return Result.Success(new SubscriptionDto(
            subscription.Id,
            package.Id,
            package.Name,
            subscription.PricePaid,
            subscription.StartDate,
            subscription.EndDate,
            subscription.IsActive));
    }
}
