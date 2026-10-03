using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.ServiceCategories.Commands.CreateServiceCategory;
using CourtBooking.Application.Features.V1.ServiceCategories.Commands.DeleteServiceCategory;
using CourtBooking.Application.Features.V1.ServiceCategories.Commands.UpdateServiceCategory;
using CourtBooking.Application.Features.V1.ServiceCategories.Dtos;
using CourtBooking.Application.Features.V1.ServiceCategories.Queries.GetServiceCategories;
using CourtBooking.Application.Features.V1.ServiceCategories.Queries.GetServiceCategoryById;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.ServiceCategories;

public sealed class ServiceCategoryEndpoints : IEndpointGroup
{
    private const string ServiceCategoryTag = "Service Categories";

    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("owner/service-categories");
        // Temporarily disabled for local API testing without JWT.
        // .RequireAuthorization(policy => policy.RequireRole("CourtOwner"));

        group.MapGet("/", GetServiceCategories)
            .WithName("GetServiceCategories")
            .WithSummary("Lấy danh sách loại dịch vụ của chủ sân")
            .WithTags(ServiceCategoryTag)
            .Produces<IReadOnlyList<ServiceCategoryDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        group.MapGet("/{id:guid}", GetServiceCategoryById)
            .WithName("GetServiceCategoryById")
            .WithSummary("Lấy chi tiết loại dịch vụ")
            .WithTags(ServiceCategoryTag)
            .Produces<ServiceCategoryDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        group.MapPost("/", CreateServiceCategory)
            .WithName("CreateServiceCategory")
            .WithSummary("Tạo loại dịch vụ")
            .WithTags(ServiceCategoryTag)
            .Produces<Guid>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapPut("/{id:guid}", UpdateServiceCategory)
            .WithName("UpdateServiceCategory")
            .WithSummary("Cập nhật loại dịch vụ")
            .WithTags(ServiceCategoryTag)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapDelete("/{id:guid}", DeleteServiceCategory)
            .WithName("DeleteServiceCategory")
            .WithSummary("Xóa loại dịch vụ chưa được sử dụng")
            .WithTags(ServiceCategoryTag)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }

    private static async Task<IResult> GetServiceCategories(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        ISender sender = default!,
        CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(
            new GetServiceCategoriesQuery(search, isActive),
            cancellationToken);

        return result.IsSuccess
            ? TypedResults.Ok(result.Value)
            : result.ToProblemDetails();
    }

    private static async Task<IResult> GetServiceCategoryById(
        Guid id,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetServiceCategoryByIdQuery(id), cancellationToken);
        return result.IsSuccess
            ? TypedResults.Ok(result.Value)
            : result.ToProblemDetails();
    }

    private static async Task<IResult> CreateServiceCategory(
        CreateServiceCategoryRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new CreateServiceCategoryCommand(request.Name, request.Description, request.IsActive),
            cancellationToken);

        return result.IsSuccess
            ? TypedResults.Created($"/api/v1/owner/service-categories/{result.Value}", result.Value)
            : result.ToProblemDetails();
    }

    private static async Task<IResult> UpdateServiceCategory(
        Guid id,
        UpdateServiceCategoryRequest request,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new UpdateServiceCategoryCommand(id, request.Name, request.Description, request.IsActive),
            cancellationToken);

        return result.IsSuccess
            ? TypedResults.NoContent()
            : result.ToProblemDetails();
    }

    private static async Task<IResult> DeleteServiceCategory(
        Guid id,
        ISender sender,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteServiceCategoryCommand(id), cancellationToken);
        return result.IsSuccess
            ? TypedResults.NoContent()
            : result.ToProblemDetails();
    }
}
