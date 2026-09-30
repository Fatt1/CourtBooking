using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.Orders.CreateOrderOnline;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Orders;

public class OrderEndpoints : IEndpointGroup
{
    private const string OrderTag = "Orders";
    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("orders");

        MapToPublic(group);
    }

    private static void MapToPublic(RouteGroupBuilder group)
    {

        // POST /api/v1/orders/online — Tạo đơn đặt sân online
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
