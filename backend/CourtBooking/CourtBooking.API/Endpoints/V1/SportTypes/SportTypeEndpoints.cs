using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.SportTypes.Commands.CreateSportType;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;

namespace CourtBooking.API.Endpoints.V1.SportTypes;

public sealed class SportTypeEndpoints : IEndpointGroup
{
    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("admin/sport-types");

        group.MapPost("/", async (
            CreateSportTypeRequest request,
            ISender sender,
            CancellationToken ct) =>
        {
            var command = new CreateSportTypeCommand(
                request.Name,
                request.ImageId);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Created(
                    $"/api/v1/sport-types/{result.Value}",
                    result.Value)
                : result.ToProblemDetails();
        })
        .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin" })
        .WithName("CreateSportType")
        .WithTags("SportTypes")
        .Produces<Guid>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}