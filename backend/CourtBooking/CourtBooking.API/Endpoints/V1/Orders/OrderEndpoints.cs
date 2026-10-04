using CourtBooking.API.Extensions;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Orders.Commands.AddFixedOrderCycle;
using CourtBooking.Application.Features.V1.Orders.Commands.AddPaymentTransaction;
using CourtBooking.Application.Features.V1.Orders.Commands.CancelOrderByOwner;
using CourtBooking.Application.Features.V1.Orders.Commands.ConfirmOrder;
using CourtBooking.Application.Features.V1.Orders.Commands.CreateFixedOrderByOwner;
using CourtBooking.Application.Features.V1.Orders.Commands.CreateOrderByOwner;
using CourtBooking.Application.Features.V1.Orders.Commands.CreateOrderOnline;
using CourtBooking.Application.Features.V1.Orders.Commands.DeleteFixedOrderCycle;
using CourtBooking.Application.Features.V1.Orders.Commands.SubmitPaymentProof;
using CourtBooking.Application.Features.V1.Orders.Commands.UpdateCustomerInfo;
using CourtBooking.Application.Features.V1.Orders.Commands.UpdateFixedOrderCycle;
using CourtBooking.Application.Features.V1.Orders.Commands.UpdateOrderDetail;
using CourtBooking.Application.Features.V1.Orders.Commands.UpdateOrderServices;
using CourtBooking.Application.Features.V1.Orders.Dtos;
using CourtBooking.Application.Features.V1.Orders.Queries.GetDailyOrderById;
using CourtBooking.Application.Features.V1.Orders.Queries.GetFixedOrderById;
using CourtBooking.Application.Features.V1.Orders.Queries.GetFixedOrdersByBranch;
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
        // GET /api/v1/owner/orders/daily — Danh sách đơn hàng đặt ngày tại 1 chi nhánh có phân trang & bộ lọc
        group.MapGet("/daily", async (
                [FromQuery] Guid branchId,
                [FromQuery] OrderStatus? status,
                [FromQuery] DateOnly? fromDate,
                [FromQuery] DateOnly? toDate,
                [FromQuery] string? search,
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 10,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetDailyOrdersByBranchQuery(
                branchId,
                status,
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
            .WithSummary("Lấy danh sách đơn hàng đặt ngày tại chi nhánh")
            .WithDescription("Trả về danh sách đơn hàng đặt ngày có phân trang, hỗ trợ lọc theo trạng thái, khoảng thời gian và tìm kiếm theo SĐT, tên khách hoặc mã đơn.")
            .WithTags(OrderTag)
            .Produces<PagedList<DailyOrderDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // GET /api/v1/owner/orders/fixed — Danh sách đơn đặt lịch cố định tại chi nhánh có phân trang & bộ lọc
        group.MapGet("/fixed", async (
                [FromQuery] Guid branchId,
                [FromQuery] OrderStatus? status,
                [FromQuery] DateOnly? fromDate,
                [FromQuery] DateOnly? toDate,
                [FromQuery] string? search,
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 10,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetFixedOrdersByBranchQuery(
                branchId,
                status,
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
            .WithName("GetFixedOrdersByBranch")
            .WithSummary("Lấy danh sách đơn đặt lịch cố định tại chi nhánh")
            .WithDescription("Trả về danh sách đơn đặt lịch cố định kèm thông tin tóm tắt từng chu kì (ngày bắt đầu, kết thúc, thứ trong tuần, khung giờ, sân).")
            .WithTags(OrderTag)
            .Produces<PagedList<FixedOrderDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // GET /api/v1/owner/orders/fixed/{id:guid} — Xem chi tiết đơn hàng lịch cố định
        group.MapGet("/fixed/{id:guid}", async (
                [FromRoute] Guid id,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var result = await sender.Send(new GetFixedOrderByIdQuery(id), ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("GetFixedOrderById")
            .WithSummary("Lấy thông tin chi tiết đơn hàng lịch cố định")
            .WithDescription("Trả về chi tiết đơn hàng lịch cố định bao gồm danh sách chu kì, danh sách các ca/buổi sinh ra, dịch vụ, hóa đơn chiết tính và thanh toán.")
            .WithTags(OrderTag)
            .Produces<FixedOrderResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // POST /api/v1/owner/orders — Chủ sân / nhân viên đặt lịch trực tiếp cho khách
        group.MapPost("/daily", async (
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

        // POST /api/v1/owner/orders/fixed — Chủ sân / nhân viên đặt lịch cố định cho khách
        group.MapPost("/fixed", async (
                [FromBody] CreateFixedOrderByOwnerCommand command,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var result = await sender.Send(command, ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("CreateFixedOrderByOwner")
            .WithSummary("Chủ sân tạo đơn đặt lịch cố định")
            .WithDescription("Dành cho chủ sân hoặc nhân viên đặt lịch cố định theo các chu kì. Tự động áp dụng bảng giá khách cố định và sinh các OrderDetail tương ứng.")
            .WithTags(OrderTag)
            .Produces<Guid>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // PUT /api/v1/owner/orders/{orderId}/confirm — Xác nhận đơn hàng
        group.MapPut("/{orderId:guid}/confirmation", async (
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

        // PUT /api/v1/owner/orders/{orderId:guid}/cancellation — Chủ sân hủy đơn hàng (kèm hoàn tiền nếu có)
        group.MapPut("/{orderId:guid}/cancellation", async (
                [FromRoute] Guid orderId,
                [FromBody] CancelOrderByOwnerCommand command,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var result = await sender.Send(command with { OrderId = orderId }, ct);
            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
            .WithName("CancelOrderByOwner")
            .WithSummary("Chủ sân hủy đơn đặt sân")
            .WithDescription("Hủy đơn đặt sân, giải phóng các slot sân, ghi nhận lý do hủy và tự động tạo giao dịch hoàn tiền nếu có số tiền hoàn.")
            .WithTags(OrderTag)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // POST /api/v1/owner/orders/{orderId:guid}/payments — Thu thêm tiền cho đơn hàng
        group.MapPost("/{orderId:guid}/payments", async (
                [FromRoute] Guid orderId,
                [FromBody] AddPaymentTransactionCommand command,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var result = await sender.Send(command with { OrderId = orderId }, ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("AddPaymentTransaction")
            .WithSummary("Thu thêm tiền cho đơn hàng")
            .WithDescription("Ghi nhận thêm một giao dịch thanh toán (tiền mặt / chuyển khoản QR) cho đơn hàng.")
            .WithTags(OrderTag)
            .Produces<Guid>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // POST /api/v1/owner/orders/{orderId:guid}/fixed-cycles — Thêm một chu kì đặt cố định mới
        group.MapPost("/{orderId:guid}/fixed-cycles", async (
            [FromRoute] Guid orderId,
            [FromBody] AddFixedOrderCycleCommand command,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(command with { OrderId = orderId }, ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("AddFixedOrderCycle")
            .WithSummary("Thêm chu kì đặt sân cố định mới vào đơn hàng")
            .WithDescription("Thêm một chu kì mới (ngày, giờ, thứ, loại sân, sân) vào đơn đặt cố định và tự động cập nhật lại toàn bộ OrderDetail.")
            .WithTags(OrderTag)
            .Produces<Guid>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // PUT /api/v1/owner/orders/{orderId:guid}/fixed-cycles/{cycleId:guid} — Cập nhật một chu kì đặt cố định
        group.MapPut("/{orderId:guid}/fixed-cycles/{cycleId:guid}", async (
            [FromRoute] Guid orderId,
            [FromRoute] Guid cycleId,
            [FromBody] UpdateFixedOrderCycleCommand command,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(command with { OrderId = orderId, CycleId = cycleId }, ct);
            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
            .WithName("UpdateFixedOrderCycle")
            .WithSummary("Cập nhật chu kì đặt sân cố định")
            .WithDescription("Cập nhật thông tin ngày, giờ, thứ và sân cho 1 chu kì, đồng thời tự động cập nhật lại toàn bộ các OrderDetail của đơn hàng.")
            .WithTags(OrderTag)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // DELETE /api/v1/owner/orders/{orderId:guid}/fixed-cycles/{cycleId:guid} — Xóa một chu kì đặt cố định
        group.MapDelete("/{orderId:guid}/fixed-cycles/{cycleId:guid}", async (
            [FromRoute] Guid orderId,
            [FromRoute] Guid cycleId,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new DeleteFixedOrderCycleCommand(orderId, cycleId), ct);
            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
            .WithName("DeleteFixedOrderCycle")
            .WithSummary("Xóa một chu kì đặt sân cố định khỏi đơn hàng")
            .WithDescription("Xóa chu kì khỏi đơn đặt cố định (yêu cầu đơn hàng có tối thiểu 2 chu kì) và tự động cập nhật lại toàn bộ OrderDetail.")
            .WithTags(OrderTag)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);


        // GET /api/v1/owner/orders/daily/{id:guid} — Xem chi tiết đơn hàng đặt sân
        group.MapGet("/daily/{id:guid}", async (
                [FromRoute] Guid id,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var result = await sender.Send(new GetDailyOrderByIdQuery(id), ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("GetDailyOrderById")
            .WithSummary("Lấy thông tin chi tiết đơn hàng đặt sân")
            .WithDescription("Trả về chi tiết đơn hàng bao gồm danh sách slot sân, dịch vụ, hóa đơn chiết tính và thanh toán.")
            .WithTags(OrderTag)
            .Produces<DailyOrderResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status403Forbidden);


        group.MapPut("/{id:guid}/items", async (
            [FromRoute] Guid id,
            [FromBody] UpdateOrderDetailCommand command,
            ISender sender
            ) =>
        {
            var result = await sender.Send(command);
            return result.IsSuccess
            ? Results.NoContent()
            : result.ToProblemDetails();
        })
            .WithName("UpdateOrderDetail")
            .WithSummary("Cập nhật chi tiết đơn hàng ngày")
            .WithDescription("Cập nhật chi tiết đơn hàng bao gồm ngày, giờ khác")
            .WithTags(OrderTag)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status403Forbidden);


        // PUT /api/v1/owner/orders/{id:guid}/customer-info — Cập nhật thông tin khách hàng cho đơn hàng
        group.MapPut("/{id:guid}/customer-info", async (
            [FromRoute] Guid id,
            [FromBody] UpdateOrderCustomerInfoCommand command,
            ISender sender
            ) =>
        {
            var result = await sender.Send(command);
            return result.IsSuccess
            ? Results.NoContent()
            : result.ToProblemDetails();
        })
            .WithName("UpdateOrderCustomerInfo")
            .WithSummary("Cập nhật thông tin khách hàng cho đơn hàng")
            .WithDescription("Cập nhật thông tin khách hàng bao gồm tên, số điện thoại")
            .WithTags(OrderTag)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // PUT /api/v1/owner/orders/{orderId:guid}/services — Cập nhật toàn bộ danh sách dịch vụ của đơn hàng
        group.MapPut("/{orderId:guid}/services", async (
            [FromRoute] Guid orderId,
            [FromBody] UpdateOrderServicesCommand command,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(command with { OrderId = orderId }, ct);
            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
            .WithName("UpdateOrderServices")
            .WithSummary("Cập nhật danh sách dịch vụ của đơn hàng")
            .WithDescription("Truyền lại toàn bộ danh sách dịch vụ để xóa cũ và cập nhật mới. Nếu truyền mảng rỗng thì sẽ xóa toàn bộ dịch vụ của đơn hàng.")
            .WithTags(OrderTag)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status403Forbidden);


    }

    // Dành cho public API
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


        // PUT /api/v1/orders/{id:guid}/payment-proof — Nộp chứng nhận thanh toán
        group.MapPut("/{id:guid}/payment-proof", async ([FromRoute] Guid id,
            [FromBody] SubmitPaymentProofCommand command,
            ISender sender) =>
        {

            var result = await sender.Send(command);
            return result.IsSuccess
            ? Results.Ok()
            : result.ToProblemDetails();
        })
            .WithName("SubmitPaymentProof")
            .WithSummary("Nộp chứng nhận thanh toán")
            .WithDescription("Nộp chứng nhận thanh toán cho đơn hàng")
            .WithTags(OrderTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status400BadRequest);
    }
}
