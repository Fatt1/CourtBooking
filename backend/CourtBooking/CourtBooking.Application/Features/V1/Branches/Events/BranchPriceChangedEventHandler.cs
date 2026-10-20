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

        // 2. Quét toàn bộ bảng giá và quy tắc giá đang Active của chi nhánh
        var activePriceTables = await dbContext.PriceTables
            .Where(pt => pt.CourtType.BranchId == notification.BranchId && pt.IsActive)
            .Select(pt => new
            {
                pt.DefaultPrice,
                pt.DefaultWalkInPrice,
                Rules = pt.Rules.Select(r => new { r.FixedCustomerPrice, r.WalkInCustomerPrice }).ToList()
            })
            .ToListAsync(cancellationToken);

        var allValidPrices = new List<decimal>();
        foreach (var pt in activePriceTables)
        {
            if (pt.DefaultPrice > 0) allValidPrices.Add(pt.DefaultPrice);
            if (pt.DefaultWalkInPrice > 0) allValidPrices.Add(pt.DefaultWalkInPrice);
            foreach (var rule in pt.Rules)
            {
                if (rule.FixedCustomerPrice > 0) allValidPrices.Add(rule.FixedCustomerPrice);
                if (rule.WalkInCustomerPrice > 0) allValidPrices.Add(rule.WalkInCustomerPrice);
            }
        }

        var newMinPrice = allValidPrices.Count > 0 ? allValidPrices.Min() : 0m;
        var newMaxPrice = allValidPrices.Count > 0 ? allValidPrices.Max() : 0m;

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

