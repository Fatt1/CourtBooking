using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.Reviews.Commands.CreateReview;
using CourtBooking.Application.Features.V1.Reviews.Queries.GetReviewByBranch;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Reviews;

public sealed class ReviewEndpoints : IEndpointGroup
{
    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("reviews")
            .WithTags("Reviews");

        // 1. POST /api/v1/reviews — Đánh giá sân sau khi hoàn thành đơn hàng (Yêu cầu đăng nhập)
        group.MapPost("", async (
            [FromBody] CreateReviewCommand command,
            ISender sender,
            CancellationToken cancellationToken) =>
        {
            var result = await sender.Send(command, cancellationToken);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
        .RequireAuthorization()
        .WithName("CreateReview")
        .WithSummary("Đánh giá sân sau khi hoàn thành đơn hàng")
        .WithDescription("Chỉ áp dụng cho người dùng đã sử dụng sân và đơn hàng đã hoàn thành.");

        // 2. GET /api/v1/reviews — Lấy danh sách đánh giá của 1 chi nhánh (Công khai)
        group.MapGet("", async (
            [FromQuery] Guid branchId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            ISender sender = default!,
            CancellationToken cancellationToken = default) =>
        {
            var query = new GetReviewByBranchQuery(branchId, page, pageSize);
            var result = await sender.Send(query, cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
        .AllowAnonymous()
        .WithName("GetReviews")
        .WithSummary("Lấy danh sách đánh giá của 1 chi nhánh")
        .WithDescription("Lấy danh sách đánh giá và điểm trung bình của một chi nhánh.");
    }
}
