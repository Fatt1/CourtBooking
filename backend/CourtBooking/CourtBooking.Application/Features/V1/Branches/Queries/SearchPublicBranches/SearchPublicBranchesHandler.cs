using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Features.V1.Storages.Dtos;
using CourtBooking.Application.Helpers;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Queries.SearchPublicBranches;

internal sealed class SearchPublicBranchesHandler(IApplicationDbContext dbContext)
    : IQueryHandler<SearchPublicBranchesQuery, PagedList<PublicBranchListItemDto>>
{
    private const double KmPerDegLat = 110.574;
    private const double KmPerDegLngAtEquator = 111.320;

    public async Task<Result<PagedList<PublicBranchListItemDto>>> Handle(
        SearchPublicBranchesQuery request,
        CancellationToken cancellationToken)
    {
        var q = dbContext.Branches.AsNoTracking()
            .Where(b => b.IsActive);

        // ── Địa chỉ: chuỗi cố định từ FE → so sánh bằng ────────────────
        if (!string.IsNullOrWhiteSpace(request.Province))
            q = q.Where(b => b.Province == request.Province);

        if (!string.IsNullOrWhiteSpace(request.District))
            q = q.Where(b => b.District == request.District);

        // ── Từ khoá: tìm theo tên, địa chỉ chi nhánh ──────────────────
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var pattern = $"%{request.Search.Trim()}%";
            q = q.Where(b => EF.Functions.Like(b.Name, pattern));
        }

        // ── Môn thể thao ───────────────────────────────────────────────
        if (request.SportTypeIds is { Count: > 0 } sportTypeIds)
            q = q.Where(b => b.BranchSportTypes.Any(x => sportTypeIds.Contains(x.SportTypeId)));

        // ── Loại sân (VD: Sân 5, Sân 7, Sân đôi...) ──────────────────
        if (!string.IsNullOrWhiteSpace(request.CourtTypeName))
        {
            var ctPattern = $"%{request.CourtTypeName.Trim()}%";
            q = q.Where(b => b.CourtTypes.Any(ct => EF.Functions.Like(ct.Name, ctPattern)));
        }

        // ── Rating >= X ────────────────────────────────────────────────
        if (request.Rating is { } rating)
            q = q.Where(b => b.ReviewAverage >= rating);

        // ── Giá: so sánh dựa trên MinPrice của chi nhánh ───────────────
        if (request.MinPrice is { } minPrice)
            q = q.Where(b => b.MinPrice >= minPrice);

        if (request.MaxPrice is { } maxPrice)
            q = q.Where(b => b.MinPrice <= maxPrice);

        // ── Khung giờ: kiểm tra giờ mở cửa và sân trống trực tiếp bằng SQL ──
        var isTimeSearch = request.Date.HasValue && request.StartTime.HasValue && request.EndTime.HasValue;
        IQueryable<Court>? freeCourts = null;

        if (isTimeSearch)
        {
            var date = request.Date!.Value;
            var slotStart = request.StartTime!.Value;
            var slotEnd = request.EndTime!.Value;

            // Kiểm tra trong giờ mở cửa (hỗ trợ cả chi nhánh mở qua đêm)
            q = q.Where(b =>
                (b.CloseTime > b.OpenTime && slotStart >= b.OpenTime && slotEnd <= b.CloseTime)
                || (b.CloseTime < b.OpenTime && (slotStart >= b.OpenTime || slotEnd <= b.CloseTime)));

            // Sân còn trống: trạng thái Available và không có OrderDetail chồng giờ
            freeCourts = dbContext.Courts.AsNoTracking()
                .Where(c => c.Status == CourtStatus.Available
                    && !dbContext.OrderDetails.Any(d =>
                        d.CourtId == c.Id
                        && d.Date == date
                        && d.StartTime < slotEnd
                        && d.EndTime > slotStart
                        && d.Order.Status != OrderStatus.Cancelled
                        && d.Order.Status != OrderStatus.AwaitingPayment));

            // Lọc các chi nhánh có ít nhất 1 sân trống trong khung giờ (dịch thành EXISTS trong SQL)
            q = q.Where(b => freeCourts.Any(c => c.CourtType.BranchId == b.Id));
        }

        // ── Khoảng cách toạ độ: tính ngay trong SQL nếu có toạ độ ──────
        // Nếu người dùng không mở định vị (latitude/longitude null), mặc định lấy tọa độ Dinh Độc Lập
        var userLat = request.Latitude ?? GeoHelper.DefaultLatitude;
        var userLng = request.Longitude ?? GeoHelper.DefaultLongitude;

        double lat = (double)userLat;
        double lng = (double)userLng;
        double kmPerDegLng = KmPerDegLngAtEquator * Math.Cos(lat * Math.PI / 180);

        var rows = from b in q
                   let hasCoords = b.Latitude != null && b.Longitude != null
                   let dy = hasCoords ? ((double)b.Latitude! - lat) * KmPerDegLat : 0
                   let dx = hasCoords ? ((double)b.Longitude! - lng) * kmPerDegLng : 0
                   select new
                   {
                       Branch = b,
                       DistanceKm = hasCoords ? (double?)Math.Sqrt(dx * dx + dy * dy) : null
                   };

        var totalCount = await rows.CountAsync(cancellationToken);
        if (totalCount == 0)
        {
            return Result.Success(new PagedList<PublicBranchListItemDto>(
                [], 0, request.Page, request.PageSize));
        }

        // ── Sắp xếp: có Id làm tie-breaker để phân trang ổn định ────────
        var sorted = request.Sort switch
        {
            // Sắp xếp theo khoảng cách: đẩy các chi nhánh chưa có tọa độ (null) xuống cuối
            "distance" => rows
                .OrderBy(x => x.DistanceKm == null)
                .ThenBy(x => x.DistanceKm)
                .ThenBy(x => x.Branch.Id),

            "rating_desc" => rows
                .OrderByDescending(x => x.Branch.ReviewAverage)
                .ThenBy(x => x.Branch.Id),

            // Chi nhánh chưa có giá (null) đẩy xuống cuối
            "price_asc" => rows
                .OrderBy(x => x.Branch.MinPrice == null)
                .ThenBy(x => x.Branch.MinPrice)
                .ThenBy(x => x.Branch.Id),

            "price_desc" => rows
                .OrderByDescending(x => x.Branch.MinPrice)
                .ThenBy(x => x.Branch.Id),

            _ => rows
                .OrderBy(x => x.Branch.Name)
                .ThenBy(x => x.Branch.Id)
        };

        // ── Phân trang trên DB: chỉ lấy đúng số chi nhánh của trang hiện tại ──
        var page = await sorted
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new
            {
                x.Branch.Id,
                x.Branch.Name,
                x.Branch.Province,
                x.Branch.District,
                x.Branch.Street,
                x.Branch.Latitude,
                x.Branch.Longitude,
                x.Branch.OpenTime,
                x.Branch.CloseTime,
                x.Branch.ReviewAverage,
                x.Branch.MinPrice,
                x.Branch.MaxPrice,
                x.DistanceKm,
                CoverImage = x.Branch.Images
                    .OrderBy(i => i.DisplayOrder)
                    .Select(i => new ImageDto(i.Image.StorageKey, i.ImageId))
                    .FirstOrDefault(),
                Sports = x.Branch.BranchSportTypes
                    .Select(s => new BranchSportDto(s.SportTypeId, s.SportType.Name))
                    .ToList(),
                CourtTypes = x.Branch.CourtTypes
                    .Select(ct => ct.Name)
                    .ToList(),
                Services = x.Branch.ServiceBranches
                    .Where(sb => sb.IsActive)
                    .Select(sb => sb.Service.Name)
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        // ── Đếm số sân trống: chỉ đếm cho các chi nhánh thuộc trang hiện tại ──
        Dictionary<Guid, int> freeCountByBranch = [];
        if (freeCourts is not null && page.Count > 0)
        {
            var pageBranchIds = page.Select(p => p.Id).ToList();
            freeCountByBranch = await freeCourts
                .Where(c => pageBranchIds.Contains(c.CourtType.BranchId))
                .GroupBy(c => c.CourtType.BranchId)
                .Select(g => new { BranchId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.BranchId, x => x.Count, cancellationToken);
        }

        // ── Tính khoảng giá thực tế từ tất cả bảng giá đang Active của các chi nhánh trang này ──
        var pageIds = page.Select(p => p.Id).ToList();
        var branchPriceRanges = new Dictionary<Guid, (decimal Min, decimal Max)>();
        if (pageIds.Count > 0)
        {
            var priceTables = await dbContext.PriceTables.AsNoTracking()
                .Where(pt => pageIds.Contains(pt.CourtType.BranchId) && pt.IsActive)
                .Select(pt => new
                {
                    BranchId = pt.CourtType.BranchId,
                    pt.DefaultPrice,
                    pt.DefaultWalkInPrice,
                    Rules = pt.Rules.Select(r => new { r.FixedCustomerPrice, r.WalkInCustomerPrice }).ToList()
                })
                .ToListAsync(cancellationToken);

            foreach (var g in priceTables.GroupBy(x => x.BranchId))
            {
                var prices = new List<decimal>();
                foreach (var pt in g)
                {
                    if (pt.DefaultPrice > 0) prices.Add(pt.DefaultPrice);
                    if (pt.DefaultWalkInPrice > 0) prices.Add(pt.DefaultWalkInPrice);
                    foreach (var r in pt.Rules)
                    {
                        if (r.FixedCustomerPrice > 0) prices.Add(r.FixedCustomerPrice);
                        if (r.WalkInCustomerPrice > 0) prices.Add(r.WalkInCustomerPrice);
                    }
                }
                if (prices.Count > 0)
                {
                    branchPriceRanges[g.Key] = (prices.Min(), prices.Max());
                }
            }
        }

        var items = page.Select(p =>
        {
            var freeCount = freeCountByBranch.GetValueOrDefault(p.Id);
            var (minPrice, maxPrice) = branchPriceRanges.TryGetValue(p.Id, out var range)
                ? range
                : (p.MinPrice, p.MaxPrice);

            return new PublicBranchListItemDto(
                p.Id,
                p.Name,
                p.Street + ", " + p.District + ", " + p.Province,
                p.CoverImage,
                p.Sports,
                p.OpenTime,
                p.CloseTime,
                p.ReviewAverage,
                p.DistanceKm.HasValue ? Math.Round(p.DistanceKm.Value, 1) : null,
                AvailableCourtCount: isTimeSearch ? freeCount : null,
                minPrice,
                maxPrice,
                CourtTypes: p.CourtTypes,
                Services: p.Services);
        }).ToList();

        return Result.Success(new PagedList<PublicBranchListItemDto>(
            items,
            totalCount,
            request.Page,
            request.PageSize));
    }
}
