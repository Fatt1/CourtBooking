using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Events.Commands.SubmitEventTicketProof;

internal sealed class SubmitEventTicketProofCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext,
    IPublisher publisher) : ICommandHandler<SubmitEventTicketProofCommand>
{
    public async Task<Result> Handle(
        SubmitEventTicketProofCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra xác thực người dùng
        if (!userContext.IsAuthenticated || userContext.UserId == Guid.Empty)
        {
            return Result.Failure(new ForbiddenError("Bạn cần đăng nhập để thực hiện thao tác này."));
        }

        var currentUserId = userContext.UserId;

        // 2. Tìm vé tham gia sự kiện theo Id và EventId
        var ticket = await dbContext.EventTickets
            .Include(t => t.Player)
            .Include(t => t.Event)
                .ThenInclude(e => e.Order)
                    .ThenInclude(o => o.Branch)
            .FirstOrDefaultAsync(
                t => t.Id == request.TicketId && t.EventId == request.EventId,
                cancellationToken);

        if (ticket is null)
        {
            return Result.Failure(new NotFoundError("EventTicket", request.TicketId));
        }

        // 3. Kiểm tra quyền sở hữu vé
        if (ticket.PlayerId != currentUserId)
        {
            return Result.Failure(new ForbiddenError("Bạn không có quyền thực hiện thao tác trên vé này."));
        }

        // 4. Kiểm tra trạng thái vé: Chỉ cho phép gửi bằng chứng khi đang chờ thanh toán
        if (ticket.Status != EventTicketStatus.AwaitingPayment)
        {
            return Result.Failure(new ConflictError("Chỉ có thể gửi bằng chứng thanh toán cho vé đang chờ thanh toán."));
        }

        // 5. Cập nhật thông tin vé sang trạng thái Chờ duyệt (PendingApproval)
        ticket.ProofImageId = request.ProofImageId;
        ticket.PaymentMethod = PaymentMethod.QrTransfer;
        ticket.Status = EventTicketStatus.PendingApproval;

        await dbContext.SaveChangesAsync(cancellationToken);

        // 6. Kích hoạt sự kiện lưu trữ hình ảnh minh chứng
        await publisher.Publish(new AttachImagesEvent(new List<Guid> { request.ProofImageId }), cancellationToken);

        // 7. Kích hoạt sự kiện RequestedEventTicketEvent thông báo cho chủ sân
        if (ticket.Event?.Order?.Branch != null)
        {
            await publisher.Publish(new CourtBooking.Application.Features.V1.Events.Events.RequestedEventTicket.RequestedEventTicketEvent(
                ticket.Id,
                ticket.EventId,
                ticket.Event.Title,
                ticket.Event.Order.BranchId,
                ticket.Event.Order.Branch.Name,
                ticket.Event.Order.Branch.CourtOwnerId,
                ticket.Player?.FullName ?? "Khách hàng",
                ticket.Quantity,
                ticket.Price * ticket.Quantity,
                DateTime.UtcNow
            ), cancellationToken);
        }

        return Result.Success();
    }
}
