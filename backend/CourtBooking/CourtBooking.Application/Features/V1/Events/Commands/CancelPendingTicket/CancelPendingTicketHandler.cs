using System.Data;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Events.Commands.CancelPendingTicket;

internal sealed class CancelPendingTicketHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<CancelPendingTicketCommand>
{
    public async Task<Result> Handle(
        CancelPendingTicketCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra xác thực người dùng
        if (!userContext.IsAuthenticated || userContext.UserId == Guid.Empty)
        {
            return Result.Failure(new ForbiddenError("Bạn cần đăng nhập để thao tác."));
        }

        var currentUserId = userContext.UserId;

        // 2. Chạy trong transaction để hoàn lại số vé an toàn
        var strategy = dbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(
                IsolationLevel.ReadCommitted,
                cancellationToken);

            try
            {
                // 3. Tìm vé đang chờ duyệt theo Id và EventId
                var ticket = await dbContext.EventTickets
                    .FirstOrDefaultAsync(
                        t => t.Id == request.TicketId && t.EventId == request.EventId,
                        cancellationToken);

                if (ticket is null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Result.Failure(new NotFoundError("EventTicket", request.TicketId));
                }

                // 4. Kiểm tra quyền sở hữu vé
                if (ticket.PlayerId != currentUserId)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Result.Failure(new ForbiddenError("Bạn không có quyền thao tác trên vé này."));
                }

                // 5. Nếu vé đã bị hủy trước đó thì coi như thành công (idempotent)
                if (ticket.Status == EventTicketStatus.Cancelled)
                {
                    await transaction.CommitAsync(cancellationToken);
                    return Result.Success();
                }

                // Chỉ cho phép hủy khi vé đang ở trạng thái AwaitingPayment hoặc PendingApproval
                if (ticket.Status != EventTicketStatus.AwaitingPayment && ticket.Status != EventTicketStatus.PendingApproval)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Result.Failure(new ConflictError("Chỉ có thể hủy đơn đặt vé khi đang trong trạng thái chờ thanh toán."));
                }

                // 6. Cập nhật trạng thái vé sang Cancelled
                ticket.Status = EventTicketStatus.Cancelled;

                // 7. Khóa và hoàn lại số vé cho sự kiện
                var sportEvent = await dbContext.SportEvents
                    .FromSqlInterpolated($"SELECT * FROM Events WITH (UPDLOCK, ROWLOCK) WHERE Id = {request.EventId}")
                    .FirstOrDefaultAsync(cancellationToken);

                if (sportEvent is not null)
                {
                    sportEvent.AvailableSlot += ticket.Quantity;
                    if (sportEvent.AvailableSlot > sportEvent.Slots)
                    {
                        sportEvent.AvailableSlot = sportEvent.Slots;
                    }

                    // Nếu sự kiện đang ở trạng thái Hết vé (Full) thì mở lại Open
                    if (sportEvent.Status == EventStatus.Full && sportEvent.AvailableSlot > 0)
                    {
                        sportEvent.Status = EventStatus.Open;
                    }
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
