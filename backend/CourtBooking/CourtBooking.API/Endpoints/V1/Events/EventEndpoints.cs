using CourtBooking.API.Extensions;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Events.Commands.BookEventTicket;
using CourtBooking.Application.Features.V1.Events.Dtos;
using CourtBooking.Application.Features.V1.Events.Queries.GetPublicEventById;
using CourtBooking.Application.Features.V1.Events.Queries.GetPublicEvents;
using CourtBooking.Application.Features.V1.OwnerEvents.Commands.ApproveEventTicket;
using CourtBooking.Application.Features.V1.OwnerEvents.Commands.CancelEvent;
using CourtBooking.Application.Features.V1.OwnerEvents.Commands.CreateEvent;
using CourtBooking.Application.Features.V1.OwnerEvents.Commands.RejectEventTicket;
using CourtBooking.Application.Features.V1.OwnerEvents.Commands.UpdateEvent;
using CourtBooking.Application.Features.V1.OwnerEvents.Dtos;
using CourtBooking.Application.Features.V1.OwnerEvents.Queries.GetEventParticipants;
using CourtBooking.Application.Features.V1.OwnerEvents.Queries.GetOwnerEventById;
using CourtBooking.Application.Features.V1.OwnerEvents.Queries.GetOwnerEventsByBranch;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Events;

public sealed class EventEndpoints : IEndpointGroup
{
    private const string EventTag = "Events";

    public void Map(IEndpointRouteBuilder app)
    {
        // Nhóm route gốc: /api/v1/events
        var group = app.MapApiV1Group("events");
        MapToPublic(group);



        var groupOwner = app.MapApiV1Group("owner/events")
            .RequireAuthorization();

        MapToOwner(groupOwner);

    }

    private static void MapToPublic(RouteGroupBuilder group)
    {
        // 1. GET /api/v1/events — Lấy danh sách sự kiện công khai (Lọc & Phân trang)
        group.MapGet("/", async (
                [FromQuery] string? search,
                [FromQuery] Guid? sportTypeId,
                [FromQuery] Guid? branchId,
                [FromQuery] DateOnly? date,
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 10,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetPublicEventsQuery(
                search,
                sportTypeId,
                branchId,
                date,
                page,
                pageSize);

            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("GetPublicEvents")
            .WithSummary("Lấy danh sách sự kiện thể thao công khai")
            .WithDescription("Trả về danh sách thẻ sự kiện có phân trang, hỗ trợ tìm kiếm theo từ khóa (tiêu đề, sân, địa phương), môn thể thao, chi nhánh và ngày diễn ra.")
            .WithTags(EventTag)
            .Produces<PagedList<EventCardDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        // 2. GET /api/v1/events/{id:guid} — Xem chi tiết sự kiện
        group.MapGet("/{id:guid}", async (
                [FromRoute] Guid id,
                ISender sender,
                CancellationToken ct) =>
        {
            var query = new GetPublicEventByIdQuery(id);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("GetPublicEventById")
            .WithSummary("Xem thông tin chi tiết sự kiện thể thao")
            .WithDescription("Trả về thông tin chi tiết sự kiện bao gồm mô tả, lịch trình, thông tin chi nhánh sân kèm danh sách ảnh và tóm tắt những người chơi đã đăng ký vé.")
            .WithTags(EventTag)
            .Produces<EventDetailDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // 3. POST /api/v1/events/{id:guid}/tickets — Đặt mua vé sự kiện (Cần Auth & Pessimistic Lock)
        group.MapPost("/{id:guid}/tickets", async (
                [FromRoute] Guid id,
                [FromBody] BookEventTicketRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new BookEventTicketCommand(
                id,
                request.Quantity,
                request.PaymentMethod,
                request.ProofImageId);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .RequireAuthorization()
            .WithName("BookEventTicket")
            .WithSummary("Đặt mua vé sự kiện thể thao")
            .WithDescription("Dành cho Người chơi (Player) đặt mua vé. Áp dụng Pessimistic Locking chống bán vượt số lượng vé (overselling). Yêu cầu đã đăng nhập.")
            .WithTags(EventTag)
            .Produces<BookEventTicketResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }

    public void MapToOwner(RouteGroupBuilder group)
    {
        // 1. GET /api/v1/owner/events — Danh sách sự kiện của chi nhánh (Tab Sự kiện - Quản lý lịch đặt)
        group.MapGet("/", async (
                [FromQuery] Guid branchId,
                [FromQuery] Guid? sportTypeId,
                [FromQuery] EventStatus? status,
                [FromQuery] DateOnly? date,
                [FromQuery] DateOnly? fromDate,
                [FromQuery] DateOnly? toDate,
                [FromQuery] string? search,
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 10,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetOwnerEventsByBranchQuery(
                branchId,
                sportTypeId,
                status,
                date,
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
            .WithName("GetOwnerEventsByBranch")
            .WithSummary("Lấy danh sách sự kiện thể thao tại chi nhánh")
            .WithDescription("Dành cho chủ sân xem danh sách sự kiện trên tab Sự kiện. Có phân trang, lọc theo trạng thái, bộ môn, ngày và tìm kiếm theo tiêu đề.")
            .WithTags(EventTag)
            .Produces<PagedList<OwnerEventItemDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // 2. GET /api/v1/owner/events/{id:guid} — Chi tiết sự kiện để nạp vào form cập nhật
        group.MapGet("/{id:guid}", async (
                [FromRoute] Guid id,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetOwnerEventByIdQuery(id);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("GetOwnerEventById")
            .WithSummary("Lấy chi tiết sự kiện cho chủ sân")
            .WithDescription("Trả về thông tin chi tiết sự kiện kèm danh sách sân con đang được sử dụng để hiển thị hoặc chỉnh sửa.")
            .WithTags(EventTag)
            .Produces<OwnerEventDetailDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // 3. POST /api/v1/owner/events — Tạo sự kiện mới và khóa sân trên Time Grid
        group.MapPost("/", async (
                [FromBody] CreateOwnerEventRequest request,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var command = new CreateEventCommand(
                request.BranchId,
                request.Title,
                request.SportTypeId,
                request.Date,
                request.StartTime,
                request.EndTime,
                request.TicketPrice,
                request.Slots,
                request.SkillLevelFrom,
                request.SkillLevelTo,
                request.Description,
                request.CourtIds);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.CreatedAtRoute("GetOwnerEventById", new { id = result.Value }, result.Value)
                : result.ToProblemDetails();
        })
            .WithName("CreateOwnerEvent")
            .WithSummary("Tạo sự kiện thể thao mới (Khóa slot sân Time Grid)")
            .WithDescription("Chủ sân tạo sự kiện thể thao. Hệ thống kiểm tra xung đột lịch và tự động tạo đơn Order xác nhận để khóa các slot sân con trên Time Grid.")
            .WithTags(EventTag)
            .Produces<Guid>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict);

        // 4. PUT /api/v1/owner/events/{id:guid} — Cập nhật thông tin sự kiện
        group.MapPut("/{id:guid}", async (
                [FromRoute] Guid id,
                [FromBody] UpdateOwnerEventRequest request,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var command = new UpdateEventCommand(
                id,
                request.Title,
                request.TicketPrice,
                request.Slots,
                request.SkillLevelFrom,
                request.SkillLevelTo,
                request.Description);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok()
                : result.ToProblemDetails();
        })
            .WithName("UpdateOwnerEvent")
            .WithSummary("Cập nhật thông tin sự kiện thể thao")
            .WithDescription("Chủ sân cập nhật tiêu đề, số lượng vé, giá vé, trình độ và mô tả của sự kiện.")
            .WithTags(EventTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        // 5. PUT /api/v1/owner/events/{id:guid}/cancel — Hủy sự kiện và giải phóng Time Grid
        group.MapPut("/{id:guid}/cancel", async (
                [FromRoute] Guid id,
                [FromBody] CancelOwnerEventRequest request,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var command = new CancelEventCommand(id, request.Reason);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok()
                : result.ToProblemDetails();
        })
            .WithName("CancelOwnerEvent")
            .WithSummary("Hủy sự kiện thể thao")
            .WithDescription("Hủy sự kiện, hủy Order liên kết để tự động giải phóng toàn bộ slot sân trên Time Grid và đánh dấu hủy toàn bộ vé tham gia.")
            .WithTags(EventTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        // 6. GET /api/v1/owner/events/{id:guid}/participants — Lấy danh sách người tham gia & duyệt thanh toán
        group.MapGet("/{id:guid}/participants", async (
                [FromRoute] Guid id,
                [FromQuery] EventTicketStatus? status,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetEventParticipantsQuery(id, status);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("GetEventParticipants")
            .WithSummary("Lấy danh sách người tham gia sự kiện và vé")
            .WithDescription("Modal 'Người tham gia: [Tên Sự Kiện]'. Hiển thị tóm tắt tổng số vé đã bán, đang chờ duyệt, doanh thu và danh sách người mua vé kèm ảnh chuyển khoản.")
            .WithTags(EventTag)
            .Produces<EventParticipantsResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // 7. PUT /api/v1/owner/events/{id:guid}/tickets/{ticketId:guid}/approve — Duyệt vé tham gia
        group.MapPut("/{id:guid}/tickets/{ticketId:guid}/approve", async (
                [FromRoute] Guid id,
                [FromRoute] Guid ticketId,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var command = new ApproveEventTicketCommand(id, ticketId);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok()
                : result.ToProblemDetails();
        })
            .WithName("ApproveEventTicket")
            .WithSummary("Duyệt vé tham gia sự kiện")
            .WithDescription("Chủ sân duyệt vé chuyển khoản sau khi đã kiểm tra ủy nhiệm chi/bill thanh toán hợp lệ.")
            .WithTags(EventTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        // 8. PUT /api/v1/owner/events/{id:guid}/tickets/{ticketId:guid}/reject — Từ chối vé tham gia
        group.MapPut("/{id:guid}/tickets/{ticketId:guid}/reject", async (
                [FromRoute] Guid id,
                [FromRoute] Guid ticketId,
                [FromBody] RejectOwnerEventTicketRequest request,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var command = new RejectEventTicketCommand(id, ticketId, request.Reason);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok()
                : result.ToProblemDetails();
        })
            .WithName("RejectEventTicket")
            .WithSummary("Từ chối vé tham gia sự kiện")
            .WithDescription("Chủ sân từ chối vé kèm lý do. Vé sẽ bị hủy và số lượng slot tương ứng sẽ được tự động hoàn lại vào AvailableSlot của sự kiện.")
            .WithTags(EventTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
