using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetOneTimeBooking;

internal sealed class GetOneTimeBookingHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetOneTimeBookingQuery, OneTimeBookingScheduleDto>
{
    public async Task<Result<OneTimeBookingScheduleDto>> Handle(
        GetOneTimeBookingQuery request,
        CancellationToken cancellationToken)
    {
        var branch = await dbContext.Branches.AsNoTracking()
            .Where(b => b.Id == request.BranchId)
            .Select(b => new { b.Id, b.Name, b.OpenTime, b.CloseTime })
            .FirstOrDefaultAsync(cancellationToken);

        if (branch is null)
        {
            return Result.Failure<OneTimeBookingScheduleDto>(new NotFoundError("Branch", request.BranchId));
        }

        var courts = await dbContext.Courts.AsNoTracking()
            .Where(c => c.CourtType.BranchId == request.BranchId && c.Status != CourtStatus.Inactive)
            .OrderBy(c => c.CourtType.Name)
            .ThenBy(c => c.Name)
            .Select(c => new CourtTimelineItemDto(
                c.Id,
                c.CourtTypeId,
                c.CourtType.Name,
                c.Name,
                c.Status == CourtStatus.Maintenance))
            .ToListAsync(cancellationToken);

        var nowUtc = DateTime.UtcNow;
        var courtIds = courts.Select(c => c.CourtId).ToList();

        var occupiedSlots = await dbContext.OrderDetails.AsNoTracking()
            .Where(od => courtIds.Contains(od.CourtId)
                      && od.Date == request.Date
                      && od.Order.Status != OrderStatus.Cancelled
                      && (od.Order.Status != OrderStatus.AwaitingPayment || od.Order.HoldExpiresAt > nowUtc))
            .Select(od => new OccupiedSlotDto(
                od.CourtId,
                od.Court.Name,
                od.StartTime,
                od.EndTime,
                od.Order.OrderType == OrderType.Event ? TimelineSlotStatus.Event : TimelineSlotStatus.Booked,
                od.Order.OrderCode,
                od.Order.CustomerName,
                od.Order.OrderType == OrderType.Event ? (od.Order.Note ?? "Sự kiện") : null))
            .ToListAsync(cancellationToken);

        var result = new OneTimeBookingScheduleDto(
            branch.Id,
            branch.Name,
            request.Date,
            branch.OpenTime,
            branch.CloseTime,
            courts,
            occupiedSlots);

        return Result.Success(result);
    }
}
