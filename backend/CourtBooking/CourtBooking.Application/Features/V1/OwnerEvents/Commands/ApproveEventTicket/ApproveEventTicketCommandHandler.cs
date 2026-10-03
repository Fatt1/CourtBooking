using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.ApproveEventTicket;

internal sealed class ApproveEventTicketCommandHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<ApproveEventTicketCommand>
{
    public async Task<Result> Handle(
        ApproveEventTicketCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Tìm thông tin vé tham gia kèm thông tin sự kiện và Order
        var ticket = await dbContext.EventTickets
            .Include(t => t.Event)
                .ThenInclude(e => e.Order)
            .FirstOrDefaultAsync(t => t.Id == request.TicketId && t.EventId == request.EventId, cancellationToken);

        if (ticket is null)
        {
            return Result.Failure(new NotFoundError("EventTicket", request.TicketId));
        }

        // 2. Xác thực quyền chủ sân đối với chi nhánh của sự kiện
        var authResult = await branchAuth.EnsureOwnerAsync(ticket.Event.Order.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure(authResult.Error!);
        }

        // 3. Kiểm tra trạng thái vé
        if (ticket.Status == EventTicketStatus.Confirmed)
        {
            return Result.Failure(new ConflictError("Vé tham gia sự kiện này đã được duyệt trước đó."));
        }

        if (ticket.Status == EventTicketStatus.Cancelled)
        {
            return Result.Failure(new ConflictError("Không thể duyệt vé đã bị hủy."));
        }

        // 4. Cập nhật trạng thái vé thành Confirmed
        ticket.Status = EventTicketStatus.Confirmed;
        ticket.ReviewedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
