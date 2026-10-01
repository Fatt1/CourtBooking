using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.RetailOrders.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.RetailOrders.Queries.GetRetailOrderById;

internal sealed class GetRetailOrderByIdHandler(IApplicationDbContext dbContext, IUserContext userContext)
    : IQueryHandler<GetRetailOrderByIdQuery, RetailOrderDto>
{
    public async Task<Result<RetailOrderDto>> Handle(GetRetailOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await dbContext.RetailOrders.AsNoTracking()
            .Where(item => item.Id == request.Id && item.Branch.CourtOwnerId == userContext.UserId)
            .Select(item => new RetailOrderDto(
                item.Id,
                item.BranchId,
                item.Branch.Name,
                item.Items.Sum(detail => detail.Quantity * detail.UnitPrice),
                item.DiscountAmount,
                item.TotalAmount,
                item.OrderDate,
                item.CreatedAt,
                item.Items.Select(detail => new RetailOrderItemDto(
                    detail.ServiceId,
                    detail.Service.Name,
                    detail.Service.Unit,
                    detail.Quantity,
                    detail.UnitPrice,
                    detail.Quantity * detail.UnitPrice)).ToList()))
            .SingleOrDefaultAsync(cancellationToken);

        return order is null
            ? Result.Failure<RetailOrderDto>(new NotFoundError("RetailOrder", request.Id))
            : Result.Success(order);
    }
}
