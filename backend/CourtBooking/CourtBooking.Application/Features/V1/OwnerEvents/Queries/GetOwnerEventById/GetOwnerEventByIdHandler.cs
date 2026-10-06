using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.OwnerEvents.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.OwnerEvents.Queries.GetOwnerEventById;

internal sealed class GetOwnerEventByIdHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : IQueryHandler<GetOwnerEventByIdQuery, OwnerEventDetailDto>
{
    public async Task<Result<OwnerEventDetailDto>> Handle(
        GetOwnerEventByIdQuery request,
        CancellationToken cancellationToken)
    {
        var rawEvent = await dbContext.SportEvents
            .AsNoTracking()
            .Where(e => e.Id == request.EventId)
            .Select(e => new
            {
                e.Id,
                e.Order.BranchId,
                e.Title,
                e.SportTypeId,
                SportTypeName = e.SportType.Name,
                e.Date,
                e.StartTime,
                e.EndTime,
                e.TicketPrice,
                e.Slots,
                e.AvailableSlot,
                e.SkillLevelFrom,
                e.SkillLevelTo,
                e.Description,
                e.Status,
                CourtIds = e.Order.Details.Select(d => d.CourtId).Distinct().ToList(),
                Courts = e.Order.Details.Select(d => new CourtSummaryDto(d.CourtId, d.Court.Name)).Distinct().ToList(),
                SoldTickets = e.Tickets.Where(t => t.Status != EventTicketStatus.Cancelled).Sum(t => (int?)t.Quantity) ?? 0
            })
            .AsSplitQuery()
            .FirstOrDefaultAsync(cancellationToken);

        if (rawEvent is null)
        {
            return Result.Failure<OwnerEventDetailDto>(new NotFoundError("SportEvent", request.EventId));
        }

        // Kiểm tra quyền sở hữu chi nhánh của Chủ sân
        var authResult = await branchAuth.EnsureOwnerAsync(rawEvent.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<OwnerEventDetailDto>(authResult.Error!);
        }

        var dto = new OwnerEventDetailDto(
            rawEvent.Id,
            rawEvent.Title,
            rawEvent.SportTypeId,
            rawEvent.SportTypeName,
            rawEvent.Date,
            rawEvent.StartTime,
            rawEvent.EndTime,
            rawEvent.TicketPrice,
            rawEvent.Slots,
            rawEvent.AvailableSlot,
            rawEvent.SoldTickets,
            rawEvent.SkillLevelFrom,
            rawEvent.SkillLevelTo,
            rawEvent.Description,
            rawEvent.Status,
            rawEvent.CourtIds,
            rawEvent.Courts);

        return Result.Success(dto);
    }
}
