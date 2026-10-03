using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Events.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Events.Queries.GetPublicEventById;

internal sealed class GetPublicEventByIdHandler(
    IApplicationDbContext dbContext) : IQueryHandler<GetPublicEventByIdQuery, EventDetailDto>
{
    public async Task<Result<EventDetailDto>> Handle(
        GetPublicEventByIdQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Truy vấn chi tiết sự kiện kết hợp AsNoTracking và AsSplitQuery
        var eventDetail = await dbContext.SportEvents
            .AsNoTracking()
            .Where(e => e.Id == request.Id && e.Status != EventStatus.Cancelled)
            .Select(e => new EventDetailDto(
                e.Id,
                e.Title,
                e.Description,
                e.SportTypeId,
                e.SportType.Name,
                e.Date,
                e.StartTime,
                e.EndTime,
                e.SkillLevelFrom,
                e.SkillLevelTo,
                e.TicketPrice,
                e.Slots,
                e.AvailableSlot,
                e.Slots - e.AvailableSlot, // BookedSlots
                e.Status,
                // Chi nhánh tổ chức, ảnh sân và thông tin chuyển khoản QR
                new EventBranchInfoDto(
                    e.Order.BranchId,
                    e.Order.Branch.Name,
                    $"{e.Order.Branch.Street}, {e.Order.Branch.District}, {e.Order.Branch.Province}",
                    e.Order.Branch.GgMapUrl,
                    e.Order.Branch.AccountNumber,
                    e.Order.Branch.AccountName,
                    e.Order.Branch.QrImage != null
                        ? new ImageDto(e.Order.Branch.QrImage.Id, e.Order.Branch.QrImage.StorageKey)
                        : null,
                    // Danh sách toàn bộ ảnh không gian sân của chi nhánh
                    e.Order.Branch.Images
                        .OrderBy(img => img.DisplayOrder)
                        .Select(img => new BranchImageDto(
                            img.ImageId,
                            img.Image.StorageKey,
                            img.DisplayOrder))
                        .ToList()
                ),
                // Danh sách người đã đăng ký vé tham gia ("Người sẽ cùng tham gia")
                e.Tickets
                    .Where(t => t.Status != EventTicketStatus.Cancelled)
                    .OrderBy(t => t.CreatedAt)
                    .Select(t => new EventParticipantDto(
                        t.PlayerId,
                        t.Player.FullName,
                        t.Player.PlayerProfile != null && t.Player.PlayerProfile.AvatarImage != null
                            ? new ImageDto(t.Player.PlayerProfile.AvatarImage.Id, t.Player.PlayerProfile.AvatarImage.StorageKey)
                            : null,
                        t.Quantity,
                        t.CreatedAt))
                    .ToList()
            ))
            .AsSplitQuery()
            .FirstOrDefaultAsync(cancellationToken);

        // 2. Kiểm tra nếu không tồn tại sự kiện hoặc sự kiện đã bị hủy
        if (eventDetail is null)
        {
            return Result.Failure<EventDetailDto>(new NotFoundError("SportEvent", request.Id));
        }

        // 3. Trả về thông tin chi tiết sự kiện thành công
        return Result.Success(eventDetail);
    }
}
