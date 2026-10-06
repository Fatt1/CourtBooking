using CourtBooking.API.Extensions;
using CourtBooking.API.Infrastructure;
using CourtBooking.Application.Features.V1.Reviews.Commands.CreateReview;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Reviews;

public sealed class ReviewEndpoints : IEndpointGroup
{
    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("reviews")
            .WithTags("Reviews")
            .RequireAuthorization();

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
        .WithName("CreateReview")
        .WithSummary("Đánh giá sân sau khi hoàn thành đơn hàng")
        .WithDescription("Chỉ áp dụng cho người dùng đã sử dụng sân và đơn hàng đã hoàn thành.");
    }
}
