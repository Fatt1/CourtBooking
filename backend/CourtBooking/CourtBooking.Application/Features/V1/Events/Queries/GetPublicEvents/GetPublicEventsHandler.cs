using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Events.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Events.Queries.GetPublicEvents;

internal sealed class GetPublicEventsHandler(
    IApplicationDbContext dbContext) : IQueryHandler<GetPublicEventsQuery, PagedList<EventCardDto>>
{
    public async Task<Result<PagedList<EventCardDto>>> Handle(
        GetPublicEventsQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Khởi tạo truy vấn AsNoTracking - không lưu vết trạng thái entity để tối ưu RAM
        // Đồng thời lọc bỏ các sự kiện đã bị Hủy (Cancelled) để người chơi không thấy
        var query = dbContext.SportEvents
            .AsNoTracking()
            .Where(e => e.Status != EventStatus.Cancelled);

        // 2. Áp dụng các bộ lọc động (Conditional Query Filtering)
        if (request.SportTypeId.HasValue)
        {
            query = query.Where(e => e.SportTypeId == request.SportTypeId.Value);
        }

        if (request.BranchId.HasValue)
        {
            // Liên kết qua Order -> BranchId
            query = query.Where(e => e.Order.BranchId == request.BranchId.Value);
        }

        if (request.Date.HasValue)
        {
            query = query.Where(e => e.Date == request.Date.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(e =>
                e.Title.ToLower().Contains(term) ||
                e.Order.Branch.Name.ToLower().Contains(term) ||
                e.Order.Branch.Province.ToLower().Contains(term) ||
                e.Order.Branch.District.ToLower().Contains(term));
        }

        // 3. Đếm tổng số bản ghi thỏa mãn điều kiện lọc (dùng cho phân trang ở Client)
        var totalCount = await query.CountAsync(cancellationToken);

        // 4. Sắp xếp theo ngày diễn ra gần nhất và phân trang
        var items = await query
            .OrderBy(e => e.Date)
            .ThenBy(e => e.StartTime)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(e => new EventCardDto(
                e.Id,
                e.Title,
                e.SportTypeId,
                e.SportType.Name,
                e.Order.BranchId,
                e.Order.Branch.Name,
                $"{e.Order.Branch.Street}, {e.Order.Branch.District}, {e.Order.Branch.Province}",
                e.Date,
                e.StartTime,
                e.EndTime,
                e.SkillLevelFrom,
                e.SkillLevelTo,
                e.TicketPrice,
                e.Slots,
                e.AvailableSlot,
                e.Slots - e.AvailableSlot, // BookedSlots: số vé đã bán
                e.Status,
                // Lấy ảnh đầu tiên của chi nhánh theo DisplayOrder để làm ảnh bìa cho Card sự kiện
                e.Order.Branch.Images
                    .OrderBy(img => img.DisplayOrder)
                    .Select(img => new BranchImageDto(
                        img.ImageId,
                        img.Image.StorageKey,
                        img.DisplayOrder))
                    .FirstOrDefault()
            ))
            .ToListAsync(cancellationToken);

        // 5. Đóng gói kết quả vào PagedList và trả về Result thành công
        var pagedList = new PagedList<EventCardDto>(items, totalCount, request.Page, request.PageSize);
        return Result.Success(pagedList);
    }
}
