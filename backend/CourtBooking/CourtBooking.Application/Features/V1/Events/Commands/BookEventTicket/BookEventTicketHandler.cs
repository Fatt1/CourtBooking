using System.Data;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Events.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Events;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Events.Commands.BookEventTicket;

internal sealed class BookEventTicketHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<BookEventTicketCommand, BookEventTicketResponse>
{
    public async Task<Result<BookEventTicketResponse>> Handle(
        BookEventTicketCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra xác thực Người chơi
        if (!userContext.IsAuthenticated || userContext.UserId == Guid.Empty)
        {
            return Result.Failure<BookEventTicketResponse>(new ForbiddenError("Bạn cần đăng nhập để đặt mua vé sự kiện."));
        }

        var currentUserId = userContext.UserId;

        // 2. Mở Database Transaction với mức độ cô lập ReadCommitted
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.ReadCommitted, 
            cancellationToken);

        try
        {
            // 3. PESSIMISTIC LOCK: Khóa độc quyền dòng sự kiện đang mua vé bằng UPDLOCK và ROWLOCK
            // Chú ý: Bảng cơ sở dữ liệu được map tên là "Events"
            var sportEvent = await dbContext.SportEvents
                .FromSqlInterpolated($"SELECT * FROM Events WITH (UPDLOCK, ROWLOCK) WHERE Id = {request.EventId}")
                .Include(e => e.Order)
                    .ThenInclude(o => o.Branch)
                        .ThenInclude(b => b.QrImage)
                .FirstOrDefaultAsync(cancellationToken);

            // 3.1. Kiểm tra sự kiện có tồn tại không
            if (sportEvent is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result.Failure<BookEventTicketResponse>(new NotFoundError("SportEvent", request.EventId));
            }

            // 3.2. Kiểm tra trạng thái sự kiện có đang mở bán không
            if (sportEvent.Status != EventStatus.Open)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result.Failure<BookEventTicketResponse>(new ConflictError("Sự kiện hiện không mở bán vé hoặc đã kết thúc."));
            }

            // 3.3. Kiểm tra số lượng vé còn lại
            if (sportEvent.AvailableSlot < request.Quantity)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result.Failure<BookEventTicketResponse>(
                    new ConflictError($"Không đủ vé khả dụng. Hiện tại sự kiện chỉ còn {sportEvent.AvailableSlot} vé."));
            }

            // 4. Trừ số lượng vé khả dụng
            sportEvent.AvailableSlot -= request.Quantity;

            // Nếu số vé còn lại bằng 0, tự động chuyển trạng thái sự kiện sang Hết vé (Full)
            if (sportEvent.AvailableSlot == 0)
            {
                sportEvent.Status = EventStatus.Full;
            }

            // 5. Khởi tạo bản ghi vé mới (Tuân thủ Guid.CreateVersion7())
            var ticket = new EventTicket
            {
                Id = Guid.CreateVersion7(),
                EventId = sportEvent.Id,
                PlayerId = currentUserId,
                Quantity = request.Quantity,
                Price = sportEvent.TicketPrice,
                PaymentMethod = request.PaymentMethod,
                ProofImageId = request.ProofImageId,
                Status = EventTicketStatus.PendingApproval,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.EventTickets.Add(ticket);

            // 6. Lưu thay đổi vào DB và hoàn tất Transaction
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            // 7. Đóng gói kết quả trả về cho Client
            var response = new BookEventTicketResponse(
                ticket.Id,
                sportEvent.Id,
                sportEvent.Title,
                sportEvent.Order.Branch.Name,
                sportEvent.Date,
                sportEvent.StartTime,
                sportEvent.EndTime,
                ticket.Quantity,
                ticket.Price,
                ticket.Price * ticket.Quantity,
                ticket.PaymentMethod,
                ticket.Status,
                ticket.CreatedAt,
                sportEvent.Order.Branch.AccountNumber,
                sportEvent.Order.Branch.AccountName,
                sportEvent.Order.Branch.QrImage != null
                    ? new ImageDto(sportEvent.Order.Branch.QrImage.Id, sportEvent.Order.Branch.QrImage.StorageKey)
                    : null
            );

            return Result.Success(response);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
