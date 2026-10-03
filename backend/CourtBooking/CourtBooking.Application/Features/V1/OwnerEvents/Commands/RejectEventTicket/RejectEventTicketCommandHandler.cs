using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.RejectEventTicket;

internal sealed class RejectEventTicketCommandHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<RejectEventTicketCommand>
{
    public async Task<Result> Handle(
        RejectEventTicketCommand request,
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
        if (ticket.Status == EventTicketStatus.Cancelled)
        {
            return Result.Failure(new ConflictError("Vé tham gia sự kiện này đã bị hủy hoặc từ chối trước đó."));
        }

        // 4. Mở Transaction cập nhật vé và hoàn lại số lượng slot cho sự kiện
        var strategy = dbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                ticket.Status = EventTicketStatus.Cancelled;
                ticket.RefundNote = request.Reason.Trim();
                ticket.ReviewedAt = DateTime.UtcNow;

                // 4.1. Hoàn lại số slot khả dụng cho sự kiện
                ticket.Event.AvailableSlot += ticket.Quantity;
                if (ticket.Event.AvailableSlot > ticket.Event.Slots)
                {
                    ticket.Event.AvailableSlot = ticket.Event.Slots;
                }

                // 4.2. Nếu sự kiện trước đó đang Full mà có slot hoàn lại thì mở lại thành Open
                if (ticket.Event.Status == EventStatus.Full && ticket.Event.AvailableSlot > 0)
                {
                    ticket.Event.Status = EventStatus.Open;
                }

                await dbContext.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return Result.Success();
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }
}
