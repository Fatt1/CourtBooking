using CourtBooking.Application.Data;
using CourtBooking.Domain.Events;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Application.Features.V1.Branches.Events;

public sealed class BranchPriceChangedEventHandler(
    IApplicationDbContext dbContext,
    ILogger<BranchPriceChangedEventHandler> logger) : INotificationHandler<BranchPriceChangedEvent>
{
    public async Task Handle(BranchPriceChangedEvent notification, CancellationToken cancellationToken)
    {
        if (notification.BranchId == Guid.Empty)
        {
            logger.LogWarning("BranchPriceChangedEvent received with empty BranchId.");
            return;
        }

        // 1. Tải thông tin chi nhánh
        var branch = await dbContext.Branches
            .FirstOrDefaultAsync(b => b.Id == notification.BranchId, cancellationToken);

        if (branch is null)
        {
            logger.LogWarning("Không tìm thấy chi nhánh với ID {BranchId} để cập nhật khoảng giá.", notification.BranchId);
            return;
        }

        // 2. Quét toàn bộ quy tắc giá (PriceTableRule) thuộc các bảng giá đang Active của chi nhánh
        var activeRules = await dbContext.PriceTableRules
            .Where(r => r.PriceTable.CourtType.BranchId == notification.BranchId && r.PriceTable.IsActive)
            .Select(r => new { r.FixedCustomerPrice, r.WalkInCustomerPrice })
            .ToListAsync(cancellationToken);

        decimal newMinPrice;
        decimal newMaxPrice;

        if (activeRules.Count > 0)
        {
            var validPrices = activeRules
                .SelectMany(r => new[] { r.FixedCustomerPrice, r.WalkInCustomerPrice })
                .Where(p => p > 0)
                .ToList();

            newMinPrice = validPrices.Count > 0 ? validPrices.Min() : 0m;
            newMaxPrice = validPrices.Count > 0 ? validPrices.Max() : 0m;
        }
        else
        {
            // Trường hợp chi nhánh chưa có rule nào hoặc đã bị xóa hết rule trong bảng giá active:
            // Fallback sang DefaultPrice và DefaultWalkInPrice của các bảng giá đang active (nếu có), hoặc 0
            var defaultPrices = await dbContext.PriceTables
                .Where(pt => pt.CourtType.BranchId == notification.BranchId && pt.IsActive)
                .Select(pt => new { pt.DefaultPrice, pt.DefaultWalkInPrice })
                .ToListAsync(cancellationToken);

            var validDefaultPrices = defaultPrices
                .SelectMany(pt => new[] { pt.DefaultPrice, pt.DefaultWalkInPrice })
                .Where(p => p > 0)
                .ToList();

            if (validDefaultPrices.Count > 0)
            {
                newMinPrice = validDefaultPrices.Min();
                newMaxPrice = validDefaultPrices.Max();
            }
            else
            {
                newMinPrice = 0m;
                newMaxPrice = 0m;
            }
        }

        // 3. Nếu khoảng giá không thay đổi thì không cần lưu
        if (branch.MinPrice == newMinPrice && branch.MaxPrice == newMaxPrice)
        {
            logger.LogInformation(
                "Khoảng giá của chi nhánh {BranchId} không thay đổi (Min: {MinPrice}, Max: {MaxPrice}). Bỏ qua cập nhật.",
                branch.Id,
                branch.MinPrice,
                branch.MaxPrice);
            return;
        }

        // 4. Cập nhật và lưu vào cơ sở dữ liệu
        branch.MinPrice = newMinPrice;
        branch.MaxPrice = newMaxPrice;

        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Cập nhật thành công khoảng giá chi nhánh {BranchId}: MinPrice = {MinPrice}, MaxPrice = {MaxPrice}",
            branch.Id,
            branch.MinPrice,
            branch.MaxPrice);
    }
}

