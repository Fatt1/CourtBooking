using CourtBooking.API.Extensions;
using CourtBooking.Application.Extensions.Paginations;
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

public sealed class OwnerEventEndpoints : IEndpointGroup
{
    private const string OwnerEventTag = "Owner Events";

    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("owner/events")
            .RequireAuthorization();

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
            .WithTags(OwnerEventTag)
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
            .WithTags(OwnerEventTag)
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
            .WithTags(OwnerEventTag)
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
            .WithTags(OwnerEventTag)
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
            .WithTags(OwnerEventTag)
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
            .WithTags(OwnerEventTag)
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
            .WithTags(OwnerEventTag)
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
            .WithTags(OwnerEventTag)
            .Produces(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
