using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.RetailOrders.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.RetailOrders.Commands.CreateRetailOrder;

internal sealed class CreateRetailOrderHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuthorization) : ICommandHandler<CreateRetailOrderCommand, RetailOrderDto>
{
    public async Task<Result<RetailOrderDto>> Handle(CreateRetailOrderCommand request, CancellationToken cancellationToken)
    {
        var authorization = await branchAuthorization.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authorization.IsFailure)
        {
            return Result.Failure<RetailOrderDto>(authorization.Error!);
        }

        var serviceIds = request.Items.Select(item => item.ServiceId).ToList();
        var availableServices = await dbContext.ServiceBranches
            .AsNoTracking()
            .Where(sb => sb.BranchId == request.BranchId
                && serviceIds.Contains(sb.ServiceId)
                && sb.IsActive
                && sb.Service.Category.IsActive)
            .Select(sb => new { sb.ServiceId, sb.Price, sb.Service.Name, sb.Service.Unit })
            .ToListAsync(cancellationToken);

        if (availableServices.Count != serviceIds.Count)
        {
            return Result.Failure<RetailOrderDto>(new BadError(
                "Một hoặc nhiều dịch vụ không tồn tại, không hoạt động hoặc chưa được bán tại chi nhánh này."));
        }

        var subtotal = request.Items.Sum(item =>
            availableServices.Single(service => service.ServiceId == item.ServiceId).Price * item.Quantity);
        if (request.DiscountAmount > subtotal)
        {
            return Result.Failure<RetailOrderDto>(new BadError("Tiền giảm giá không được lớn hơn tiền hàng."));
        }

        var now = DateTime.UtcNow;
        var order = RetailOrder.Create(
            request.BranchId,
            request.DiscountAmount,
            now);

        foreach (var item in request.Items)
        {
            var service = availableServices.Single(s => s.ServiceId == item.ServiceId);
            order.AddItem(item.ServiceId, item.Quantity, service.Price);
        }

        await dbContext.RetailOrders.AddAsync(order, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        var branchName = await dbContext.Branches
            .Where(branch => branch.Id == request.BranchId)
            .Select(branch => branch.Name)
            .SingleAsync(cancellationToken);

        return Result.Success(new RetailOrderDto(
            order.Id,
            order.BranchId,
            branchName,
            subtotal,
            order.DiscountAmount,
            order.TotalAmount,
            order.OrderDate,
            order.CreatedAt,
            order.Items.Select(item =>
            {
                var service = availableServices.Single(s => s.ServiceId == item.ServiceId);
                return new RetailOrderItemDto(item.ServiceId, service.Name, service.Unit, item.Quantity,
                    item.UnitPrice, item.Quantity * item.UnitPrice);
            }).ToList()));
    }
}
