using CourtBooking.API.Extensions;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.RetailOrders.Commands.CreateRetailOrder;
using CourtBooking.Application.Features.V1.RetailOrders.Dtos;
using CourtBooking.Application.Features.V1.RetailOrders.Queries.GetRetailOrderById;
using CourtBooking.Application.Features.V1.RetailOrders.Queries.GetRetailOrders;
using CourtBooking.Application.Features.V1.RetailOrders.Queries.GetRetailOrderSummary;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.RetailOrders;

public sealed class RetailOrderEndpoints : IEndpointGroup
{
    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("owner/retail-orders")
            // .RequireAuthorization(policy => policy.RequireRole("CourtOwner"))
            .WithTags("Retail Orders");

        group.MapPost("/", CreateAsync)
            .WithName("CreateRetailOrder")
            .WithSummary("Tạo hóa đơn bán lẻ tại quầy")
            .Produces<RetailOrderDto>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        group.MapGet("/", GetAllAsync)
            .WithName("GetRetailOrders")
            .WithSummary("Lấy danh sách hóa đơn bán lẻ")
            .Produces<PagedList<RetailOrderListItemDto>>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        group.MapGet("/summary", GetSummaryAsync)
            .WithName("GetRetailOrderSummary")
            .WithSummary("Thống kê doanh thu bán lẻ")
            .Produces<RetailOrderSummaryDto>()
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        group.MapGet("/{id:guid}", GetByIdAsync)
            .WithName("GetRetailOrderById")
            .WithSummary("Lấy chi tiết hóa đơn bán lẻ")
            .Produces<RetailOrderDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> CreateAsync(CreateRetailOrderRequest request, ISender sender, CancellationToken ct)
    {
        var command = new CreateRetailOrderCommand(
            request.BranchId,
            request.DiscountAmount,
            request.Items?
                .Select(item => new CreateRetailOrderItem(item.ServiceId, item.Quantity))
                .ToList() ?? []);
        var result = await sender.Send(command, ct);
        return result.IsSuccess
            ? Results.Created($"/api/v1/owner/retail-orders/{result.Value.Id}", result.Value)
            : result.ToProblemDetails();
    }

    private static async Task<IResult> GetAllAsync(
        [FromQuery] Guid? branchId,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        ISender sender = default!,
        CancellationToken ct = default)
    {
        var result = await sender.Send(
            new GetRetailOrdersQuery(branchId, fromDate, toDate, page, pageSize), ct);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemDetails();
    }

    private static async Task<IResult> GetSummaryAsync(
        [FromQuery] Guid? branchId,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        ISender sender,
        CancellationToken ct)
    {
        var result = await sender.Send(new GetRetailOrderSummaryQuery(branchId, fromDate, toDate), ct);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemDetails();
    }

    private static async Task<IResult> GetByIdAsync(Guid id, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new GetRetailOrderByIdQuery(id), ct);
        return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemDetails();
    }
}
