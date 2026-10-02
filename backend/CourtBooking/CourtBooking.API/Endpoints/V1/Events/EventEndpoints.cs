using CourtBooking.API.Extensions;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Events.Commands.BookEventTicket;
using CourtBooking.Application.Features.V1.Events.Dtos;
using CourtBooking.Application.Features.V1.Events.Queries.GetPublicEventById;
using CourtBooking.Application.Features.V1.Events.Queries.GetPublicEvents;
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
}
