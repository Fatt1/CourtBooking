using CourtBooking.API.Extensions;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Orders.Commands.ConfirmOrder;
using CourtBooking.Application.Features.V1.Orders.Commands.CreateOrderByOwner;
using CourtBooking.Application.Features.V1.Orders.Commands.CreateOrderOnline;
using CourtBooking.Application.Features.V1.Orders.Dtos;
using CourtBooking.Application.Features.V1.Orders.Queries.GetOrdersByBranch;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Orders;

public class OrderEndpoints : IEndpointGroup
{
    private const string OrderTag = "Orders";

    public void Map(IEndpointRouteBuilder app)
    {
        var groupOwner = app.MapApiV1Group("owner/orders");
        MapToOwner(groupOwner);

        var group = app.MapApiV1Group("orders");
        MapToPublic(group);
    }

    private static void MapToOwner(RouteGroupBuilder group)
    {
        // GET /api/v1/owner/orders — Danh sách tất cả đơn hàng tại 1 chi nhánh có phân trang & bộ lọc
        group.MapGet("/", async (
                [FromQuery] Guid branchId,
                [FromQuery] OrderStatus? status,
                [FromQuery] OrderType? orderType,
                [FromQuery] DateOnly? fromDate,
                [FromQuery] DateOnly? toDate,
                [FromQuery] string? search,
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 10,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetOrdersByBranchQuery(
                branchId,
                status,
                orderType,
                fromDate,
                toDate,
                search,
                page,
                pageSize);

            var result = await sender.Send(query, ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("GetOrdersByBranch")
            .WithSummary("Lấy danh sách tất cả đơn hàng tại chi nhánh")
            .WithDescription("Trả về danh sách đơn hàng có phân trang, hỗ trợ lọc theo trạng thái, loại đơn (Normal, Fixed), khoảng thời gian và tìm kiếm theo SĐT, tên khách hoặc mã đơn.")
            .WithTags(OrderTag)
            .Produces<PagedList<OrderDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // POST /api/v1/owner/orders — Chủ sân / nhân viên đặt lịch trực tiếp cho khách
        group.MapPost("/", async (
                [FromBody] CreateOrderByOwnerCommand command,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var result = await sender.Send(command, ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("CreateOrderByOwner")
            .WithSummary("Chủ sân tạo đơn đặt lịch trực tiếp")
            .WithDescription("Dành cho chủ sân hoặc nhân viên đặt lịch trực tiếp cho khách tại quầy. Tính giá theo bảng giá vãng lai và cho phép áp dụng giảm giá.")
            .WithTags(OrderTag)
            .Produces<Guid>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // PUT /api/v1/owner/orders/{orderId}/confirm — Xác nhận đơn hàng
        group.MapPut("/{orderId:guid}/confirm", async (
                [FromRoute] Guid orderId,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var result = await sender.Send(new ConfirmOrderCommand(orderId), ct);
            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
            .WithName("ConfirmOrder")
            .WithSummary("Chủ sân xác nhận đơn đặt lịch")
            .WithDescription("Dành cho chủ sân xác nhận đơn đặt lịch online cho khách")
            .WithTags(OrderTag)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status403Forbidden);
    }

    private static void MapToPublic(RouteGroupBuilder group)
    {
        // POST /api/v1/orders — Tạo đơn đặt sân online
        group.MapPost("/", async (
                [FromBody] CreateOrderOnlineCommand command,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var result = await sender.Send(command, ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("CreateOrderOnline")
            .WithSummary("Tạo đơn đặt sân online")
            .WithTags(OrderTag)
            .Produces<CreateOrderOnlineResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);
    }
}
