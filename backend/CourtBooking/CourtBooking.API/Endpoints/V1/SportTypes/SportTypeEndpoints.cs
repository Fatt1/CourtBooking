using CourtBooking.Application.Features.V1.SportTypes.Commands.UpdateSportTypeStatus;
using CourtBooking.Application.Features.V1.SportTypes.Queries.GetAdminSportTypes;
using CourtBooking.Application.Features.V1.SportTypes.Queries.GetSportTypeById;
using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.SportTypes.Commands.CreateSportType;
using CourtBooking.Application.Features.V1.SportTypes.Dtos;
using CourtBooking.Application.Features.V1.SportTypes.Queries.GetSportTypes;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;

namespace CourtBooking.API.Endpoints.V1.SportTypes;

public sealed class SportTypeEndpoints : IEndpointGroup
{
    public void Map(IEndpointRouteBuilder app)
    {
        var publicGroup = app.MapApiV1Group("sport-types");

        publicGroup.MapGet("/", async (ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new GetSportTypesQuery(), ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
        .AllowAnonymous()
        .WithName("GetSportTypes")
        .WithTags("SportTypes")
        .Produces<IReadOnlyList<SportTypeDto>>(StatusCodes.Status200OK);

        publicGroup.MapGet("/{id}", async (
            Guid id,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new GetSportTypeByIdQuery(id), ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
        .AllowAnonymous()
        .WithName("GetSportTypeById")
        .WithTags("SportTypes")
        .Produces<SportTypeDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status404NotFound);

        var group = app.MapApiV1Group("admin/sport-types");

        group.MapGet("/", async (ISender sender, CancellationToken ct) =>
        {
            var result = await sender.Send(new GetAdminSportTypesQuery(), ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
        .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin" })
        .WithName("GetAdminSportTypes")
        .WithTags("SportTypes")
        .Produces<IReadOnlyList<AdminSportTypeDto>>(StatusCodes.Status200OK);

        group.MapPatch("/{id:guid}/status", async (
            Guid id,
            UpdateSportTypeStatusRequest request,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(
                new UpdateSportTypeStatusCommand(id, request.IsActive), ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin" })
        .WithName("UpdateSportTypeStatus")
        .WithTags("SportTypes")
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status404NotFound);

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
