using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Commands.CancelEvent;

internal sealed class CancelEventCommandHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<CancelEventCommand>
{
    public async Task<Result> Handle(
        CancelEventCommand request,
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

        if (sportEvent.Status == EventStatus.Cancelled)
        {
            return Result.Failure(new ConflictError("Sự kiện này đã được hủy trước đó."));
        }

        // 3. Thực hiện hủy sự kiện, hủy Order để giải phóng slot sân trên Time Grid trong Transaction
        var strategy = dbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var cancelReason = request.Reason.Trim();

                // 3.1. Đổi trạng thái sự kiện
                sportEvent.Status = EventStatus.Cancelled;

                // 3.2. Đổi trạng thái Order -> Hệ thống Time Grid tự động giải phóng toàn bộ sân con
                sportEvent.Order.Status = OrderStatus.Cancelled;
                sportEvent.Order.CancelReason = cancelReason;
                sportEvent.Order.UpdatedAt = DateTime.UtcNow;

                // 3.3. Hủy tất cả các vé chưa bị hủy của sự kiện
                foreach (var ticket in sportEvent.Tickets.Where(t => t.Status != EventTicketStatus.Cancelled))
                {
                    ticket.Status = EventTicketStatus.Cancelled;
                    ticket.RefundNote = $"Sự kiện bị hủy bởi ban tổ chức: {cancelReason}";
                    ticket.ReviewedAt = DateTime.UtcNow;
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
