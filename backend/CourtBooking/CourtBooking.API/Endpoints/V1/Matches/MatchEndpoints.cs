using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.Matches.Commands.ApproveParticipant;
using CourtBooking.Application.Features.V1.Matches.Commands.CancelMatch;
using CourtBooking.Application.Features.V1.Matches.Commands.CreateMatch;
using CourtBooking.Application.Features.V1.Matches.Commands.JoinMatch;
using CourtBooking.Application.Features.V1.Matches.Commands.LeaveMatch;
using CourtBooking.Application.Features.V1.Matches.Commands.RejectParticipant;
using CourtBooking.Application.Features.V1.Matches.Dtos;
using CourtBooking.Application.Features.V1.Matches.Queries.GetMatchById;
using CourtBooking.Application.Features.V1.Matches.Queries.GetMatches;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Matches;

public sealed class MatchEndpoints : IEndpointGroup
{
    private const string MatchTag = "Matches";

    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("matches")
            .WithTags(MatchTag);

        // 1. POST /api/v1/matches — Mở kèo giao lưu mới (Yêu cầu đăng nhập)
        group.MapPost("", async (
            [FromBody] CreateMatchCommand command,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(command, ct);
            return result.IsSuccess
                ? Results.Created($"/api/v1/matches/{result.Value}", new CreateMatchResponse(result.Value))
                : result.ToProblemDetails();
        })
        .RequireAuthorization()
        .WithName("CreateMatch")
        .WithSummary("Mở kèo giao lưu mới từ đơn đặt sân đã xác nhận")
        .Produces<CreateMatchResponse>(StatusCodes.Status201Created);

        // 2. GET /api/v1/matches — Danh sách kèo giao lưu (Công khai - hỗ trợ bộ lọc và phân trang)
        group.MapGet("", async (
            [FromQuery] Guid? branchId,
            [FromQuery] Guid? sportTypeId,
            [FromQuery] DateOnly? date,
            [FromQuery] string? skillLevel,
            [FromQuery] SocialMatchStatus? status,
            [FromQuery] Guid? hostId,
            [FromQuery] Guid? participantPlayerId,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            ISender sender = default!,
            CancellationToken ct = default) =>
        {
            var query = new GetMatchesQuery(
                branchId,
                sportTypeId,
                date,
                skillLevel,
                status,
                hostId,
                participantPlayerId,
                search,
                page,
                pageSize);

            var result = await sender.Send(query, ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
        .WithName("GetMatches")
        .WithSummary("Lấy danh sách các kèo giao lưu thể thao với bộ lọc và phân trang");

        // 3. GET /api/v1/matches/{id:guid} — Chi tiết kèo giao lưu (Công khai)
        group.MapGet("{id:guid}", async (
            [FromRoute] Guid id,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new GetMatchByIdQuery(id), ct);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
        .WithName("GetMatchById")
        .WithSummary("Lấy thông tin chi tiết của một kèo giao lưu kèm danh sách người tham gia");

        // 4. POST /api/v1/matches/{id:guid}/join — Xin tham gia kèo (Yêu cầu đăng nhập)
        group.MapPost("{id:guid}/join", async (
            [FromRoute] Guid id,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new JoinMatchCommand(id), ct);
            return result.IsSuccess
                ? Results.Ok(new JoinMatchResponse(result.Value))
                : result.ToProblemDetails();
        })
        .RequireAuthorization()
        .WithName("JoinMatch")
        .WithSummary("Xin tham gia vào một kèo giao lưu (tự động nhận hoặc chờ chủ phòng duyệt)")
        .Produces<JoinMatchResponse>(StatusCodes.Status200OK);

        // 5. POST /api/v1/matches/{id:guid}/participants/{participantId:guid}/approve — Chủ phòng duyệt thành viên (Yêu cầu đăng nhập)
        group.MapPost("{id:guid}/participants/{participantId:guid}/approve", async (
            [FromRoute] Guid id,
            [FromRoute] Guid participantId,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new ApproveParticipantCommand(id, participantId), ct);
            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .RequireAuthorization()
        .WithName("ApproveParticipant")
        .WithSummary("Chủ phòng phê duyệt yêu cầu tham gia của một thành viên");

        // 6. POST /api/v1/matches/{id:guid}/participants/{participantId:guid}/reject — Chủ phòng từ chối thành viên (Yêu cầu đăng nhập)
        group.MapPost("{id:guid}/participants/{participantId:guid}/reject", async (
            [FromRoute] Guid id,
            [FromRoute] Guid participantId,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new RejectParticipantCommand(id, participantId), ct);
            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .RequireAuthorization()
        .WithName("RejectParticipant")
        .WithSummary("Chủ phòng từ chối yêu cầu tham gia của một thành viên");

        // 7. POST /api/v1/matches/{id:guid}/leave — Người tham gia rút lui khỏi kèo (Yêu cầu đăng nhập)
        group.MapPost("{id:guid}/leave", async (
            [FromRoute] Guid id,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new LeaveMatchCommand(id), ct);
            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .RequireAuthorization()
        .WithName("LeaveMatch")
        .WithSummary("Người tham gia rút lui khỏi kèo trước giờ thi đấu");

        // 8. POST /api/v1/matches/{id:guid}/cancel — Chủ phòng hủy kèo (Yêu cầu đăng nhập)
        group.MapPost("{id:guid}/cancel", async (
            [FromRoute] Guid id,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new CancelMatchCommand(id), ct);
            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .RequireAuthorization()
        .WithName("CancelMatch")
        .WithSummary("Chủ phòng hủy kèo giao lưu");
    }
}
