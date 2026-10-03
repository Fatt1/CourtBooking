using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.OwnerEvents.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Queries.GetEventParticipants;

internal sealed class GetEventParticipantsHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : IQueryHandler<GetEventParticipantsQuery, EventParticipantsResponse>
{
    public async Task<Result<EventParticipantsResponse>> Handle(
        GetEventParticipantsQuery request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra sự tồn tại của sự kiện và lấy BranchId
        var sportEvent = await dbContext.SportEvents
            .AsNoTracking()
            .Where(e => e.Id == request.EventId)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.Slots,
                e.Order.BranchId
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (sportEvent is null)
        {
            return Result.Failure<EventParticipantsResponse>(new NotFoundError("SportEvent", request.EventId));
        }

        // 2. Kiểm tra quyền sở hữu chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(sportEvent.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<EventParticipantsResponse>(authResult.Error!);
        }

        // 3. Truy vấn danh sách vé
        var ticketsQuery = dbContext.EventTickets
            .AsNoTracking()
            .Where(t => t.EventId == request.EventId);

        if (request.Status.HasValue)
        {
            ticketsQuery = ticketsQuery.Where(t => t.Status == request.Status.Value);
        }

        var tickets = await ticketsQuery
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new EventParticipantItemDto(
                t.Id,
                t.PlayerId,
                t.Player.FullName,
                t.Player.PhoneNumber,
                t.Quantity,
                t.Price,
                t.Price * t.Quantity,
                t.PaymentMethod,
                t.Status,
                t.ProofImage != null ? new EventTicketProofImageDto(t.ProofImage.Id, t.ProofImage.StorageKey) : null,
                t.RefundNote,
                t.CreatedAt,
                t.ReviewedAt
            ))
            .ToListAsync(cancellationToken);

        // 4. Tính toán doanh thu và tiến độ vé
        // Tổng doanh thu tính từ các vé đã Xác nhận thanh toán (Confirmed)
        var totalRevenue = await dbContext.EventTickets
            .AsNoTracking()
            .Where(t => t.EventId == request.EventId && t.Status == EventTicketStatus.Confirmed)
            .SumAsync(t => (decimal?)(t.Price * t.Quantity), cancellationToken) ?? 0m;

        var soldSlots = await dbContext.EventTickets
            .AsNoTracking()
            .Where(t => t.EventId == request.EventId && t.Status != EventTicketStatus.Cancelled)
            .SumAsync(t => (int?)t.Quantity, cancellationToken) ?? 0;

        var response = new EventParticipantsResponse(
            sportEvent.Id,
            sportEvent.Title,
            totalRevenue,
            sportEvent.Slots,
            soldSlots,
            tickets);

        return Result.Success(response);
    }
}
