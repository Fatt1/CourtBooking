using CourtBooking.Application.Features.V1.Storages.Dtos;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Events.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Events.Queries.GetMyEventTickets;

internal sealed class GetMyEventTicketsQueryHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetMyEventTicketsQuery, PagedList<MyEventTicketDto>>
{
    public async Task<Result<PagedList<MyEventTicketDto>>> Handle(
        GetMyEventTicketsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = userContext.UserId;

        var query = dbContext.EventTickets
            .AsNoTracking()
            .Where(t => t.PlayerId == userId);

        if (request.Status.HasValue)
        {
            query = query.Where(t => t.Status == request.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new MyEventTicketDto(
                t.Id,
                t.EventId,
                t.Event.Title,
                t.Event.SportTypeId,
                t.Event.SportType.Name,
                t.Event.Order.BranchId,
                t.Event.Order.Branch.Name,
                $"{t.Event.Order.Branch.Street}, {t.Event.Order.Branch.District}, {t.Event.Order.Branch.Province}",
                t.Event.Order.Details.Min(d => d.Date),
                t.Event.Order.Details.Min(d => d.StartTime),
                t.Event.Order.Details.Max(d => d.EndTime),
                t.Quantity,
                t.Price,
                t.Price * t.Quantity,
                t.PaymentMethod,
                t.Status,
                t.CreatedAt,
                t.ReviewedAt,
                t.RefundNote,
                t.Event.Order.Branch.Images
                    .OrderBy(img => img.DisplayOrder)
                    .Select(img => new BranchImageDto(
                        img.ImageId,
                        img.Image.StorageKey,
                        img.DisplayOrder))
                    .FirstOrDefault(),
                t.Event.Order.Branch.BankName,
                t.Event.Order.Branch.BankCode,
                t.Event.Order.Branch.AccountNumber,
                t.Event.Order.Branch.AccountName,
                t.Event.Order.Branch.QrImage != null
                    ? new ImageDto(t.Event.Order.Branch.QrImage.StorageKey, t.Event.Order.Branch.QrImage.Id)
                    : null,
                (t.ExpiresAt ?? t.CreatedAt.AddMinutes(15))
            ))
            .ToListAsync(cancellationToken);

        var pagedList = new PagedList<MyEventTicketDto>(items, totalCount, request.Page, request.PageSize);
        return Result.Success(pagedList);
    }
}
