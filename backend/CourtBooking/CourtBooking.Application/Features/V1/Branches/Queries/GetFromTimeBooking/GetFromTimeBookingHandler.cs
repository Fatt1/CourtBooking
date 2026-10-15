using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Branches.Queries.GetOneTimeBooking;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetFromTimeBooking;

internal sealed class GetFromTimeBookingHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetFromTimeBookingQuery, TimeBookingScheduleDto>
{
    private static readonly (DayOfWeek DayOfWeek, int Number, string Name)[] DayOfWeekDefinitions =
    [
        (DayOfWeek.Monday, 2, "Thứ 2"),
        (DayOfWeek.Tuesday, 3, "Thứ 3"),
        (DayOfWeek.Wednesday, 4, "Thứ 4"),
        (DayOfWeek.Thursday, 5, "Thứ 5"),
        (DayOfWeek.Friday, 6, "Thứ 6"),
        (DayOfWeek.Saturday, 7, "Thứ 7"),
        (DayOfWeek.Sunday, 8, "Chủ nhật")
    ];

    public async Task<Result<TimeBookingScheduleDto>> Handle(
        GetFromTimeBookingQuery request,
        CancellationToken cancellationToken)
    {
        var branch = await dbContext.Branches.AsNoTracking()
            .Where(b => b.Id == request.BranchId)
            .Select(b => new { b.Id, b.Name, b.OpenTime, b.CloseTime })
            .FirstOrDefaultAsync(cancellationToken);

        if (branch is null)
        {
            return Result.Failure<TimeBookingScheduleDto>(new NotFoundError("Branch", request.BranchId));
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
                      && od.Date >= request.FromDate
                      && od.Date <= request.ToDate
                      && od.Order.Status != OrderStatus.Cancelled
                      && (od.Order.Status != OrderStatus.AwaitingPayment || od.Order.HoldExpiresAt > nowUtc))
            .Select(od => new
            {
                od.CourtId,
                CourtName = od.Court.Name,
                od.Court.CourtTypeId,
                od.Date,
                od.StartTime,
                od.EndTime,
                Status = od.Order.OrderType == OrderType.Event ? TimelineSlotStatus.Event : TimelineSlotStatus.Booked,
                od.Order.OrderCode,
                od.Order.CustomerName,
                Title = od.Order.OrderType == OrderType.Event ? (od.Order.Note ?? "Sự kiện") : null
            })
            .ToListAsync(cancellationToken);

        var courtTypeGroups = courts
            .GroupBy(c => new { c.CourtTypeId, c.CourtTypeName })
            .OrderBy(g => g.Key.CourtTypeName)
            .ToList();

        var daySchedules = new List<DayOfWeekScheduleDto>();

        foreach (var def in DayOfWeekDefinitions)
        {
            var courtTypeSchedules = new List<CourtTypeScheduleItemDto>();

            foreach (var group in courtTypeGroups)
            {
                var slotsForDayAndType = occupiedSlots
                    .Where(s => s.CourtTypeId == group.Key.CourtTypeId && s.Date.DayOfWeek == def.DayOfWeek)
                    .OrderBy(s => s.StartTime)
                    .ThenBy(s => s.Date)
                    .Select(s => new OccupiedSlotDetailDto(
                        s.CourtId,
                        s.CourtName,
                        s.Date,
                        s.StartTime,
                        s.EndTime,
                        s.Status,
                        s.OrderCode,
                        s.CustomerName,
                        s.Title))
                    .ToList();

                courtTypeSchedules.Add(new CourtTypeScheduleItemDto(
                    group.Key.CourtTypeId,
                    group.Key.CourtTypeName,
                    group.ToList(),
                    slotsForDayAndType));
            }

            daySchedules.Add(new DayOfWeekScheduleDto(
                def.DayOfWeek,
                def.Number,
                def.Name,
                courtTypeSchedules));
        }

        var result = new TimeBookingScheduleDto(
            branch.Id,
            branch.Name,
            request.FromDate,
            request.ToDate,
            branch.OpenTime,
            branch.CloseTime,
            daySchedules);

        return Result.Success(result);
    }
}
