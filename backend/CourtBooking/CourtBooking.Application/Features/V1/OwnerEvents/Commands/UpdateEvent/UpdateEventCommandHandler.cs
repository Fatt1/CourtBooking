using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.UpdateEvent;

internal sealed class UpdateEventCommandHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<UpdateEventCommand>
{
    public async Task<Result> Handle(
        UpdateEventCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Lấy thông tin sự kiện kèm Order và danh sách vé
        var sportEvent = await dbContext.SportEvents
            .Include(e => e.Order)
            .Include(e => e.Tickets)
            .FirstOrDefaultAsync(e => e.Id == request.EventId, cancellationToken);

        if (sportEvent is null)
        {
            return Result.Failure(new NotFoundError("SportEvent", request.EventId));
        }

        // 2. Kiểm tra quyền sở hữu chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(sportEvent.Order.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure(authResult.Error!);
        }

        // 3. Kiểm tra số lượng vé mới không được nhỏ hơn số vé khách đã đặt
        var soldTickets = sportEvent.Tickets
            .Where(t => t.Status != EventTicketStatus.Cancelled)
            .Sum(t => t.Quantity);

        if (request.Slots < soldTickets)
        {
            return Result.Failure(new ConflictError(
                $"Số lượng vé tối đa ({request.Slots}) không thể nhỏ hơn số vé đã được đăng ký ({soldTickets} vé)."));
        }

        // 4. Cập nhật thông tin sự kiện
        sportEvent.Title = request.Title.Trim();
        sportEvent.SportTypeId = request.SportTypeId;
        sportEvent.StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc);
        sportEvent.EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc);
        sportEvent.TicketPrice = request.TicketPrice;
        sportEvent.Slots = request.Slots;
        sportEvent.AvailableSlot = request.Slots - soldTickets;
        sportEvent.SkillLevelFrom = string.IsNullOrWhiteSpace(request.SkillLevelFrom) ? null : request.SkillLevelFrom.Trim();
        sportEvent.SkillLevelTo = string.IsNullOrWhiteSpace(request.SkillLevelTo) ? null : request.SkillLevelTo.Trim();
        sportEvent.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

        // 5. Cập nhật trạng thái sự kiện
        sportEvent.Status = request.Status;
        if (sportEvent.Status == EventStatus.Open && sportEvent.AvailableSlot <= 0)
        {
            sportEvent.Status = EventStatus.Full;
        }

        // 6. Cập nhật thông tin Order liên kết
        sportEvent.Order.OrderDate = DateOnly.FromDateTime(request.StartDate);
        if (!string.IsNullOrWhiteSpace(request.CustomerName))
            sportEvent.Order.CustomerName = request.CustomerName.Trim();
        if (!string.IsNullOrWhiteSpace(request.CustomerPhone))
            sportEvent.Order.CustomerPhone = request.CustomerPhone.Trim();
        if (request.Note != null)
            sportEvent.Order.Note = request.Note.Trim();

        sportEvent.Order.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
