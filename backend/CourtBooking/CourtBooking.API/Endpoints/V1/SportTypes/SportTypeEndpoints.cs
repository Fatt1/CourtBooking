using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.SportTypes.Commands.CreateSportType;
using CourtBooking.Application.Features.V1.SportTypes.Commands.DeleteSportType;
using CourtBooking.Application.Features.V1.SportTypes.Commands.UpdateSportType;
using CourtBooking.Application.Features.V1.SportTypes.Dtos;
using CourtBooking.Application.Features.V1.SportTypes.Queries.GetAdminSportTypes;
using CourtBooking.Application.Features.V1.SportTypes.Queries.GetSportTypeById;
using CourtBooking.Application.Features.V1.SportTypes.Queries.GetSportTypes;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;

namespace CourtBooking.API.Endpoints.V1.SportTypes;

public sealed class SportTypeEndpoints : IEndpointGroup
{
    private const string SportTypeTag = "SportTypes";

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
        .WithSummary("Lấy danh sách môn thể thao")
        .WithDescription("Trả về danh sách các môn thể thao phục vụ người dùng công khai.")
        .WithTags(SportTypeTag)
        .Produces<IReadOnlyList<SportTypeDto>>(StatusCodes.Status200OK);

        publicGroup.MapGet("/{id:guid}", async (
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
        .WithSummary("Lấy thông tin chi tiết môn thể thao")
        .WithDescription("Trả về thông tin chi tiết của một môn thể thao theo Id.")
        .WithTags(SportTypeTag)
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
        // .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin" })
        .WithName("GetAdminSportTypes")
        .WithSummary("Lấy danh sách tất cả môn thể thao cho quản trị viên")
        .WithDescription("Trả về danh sách tất cả môn thể thao trong hệ thống kèm số lượng chi nhánh liên kết.")
        .WithTags(SportTypeTag)
        .Produces<IReadOnlyList<AdminSportTypeDto>>(StatusCodes.Status200OK);

        group.MapDelete("/{id:guid}", async (
            Guid id,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new DeleteSportTypeCommand(id), ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        // .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin" })
        .WithName("DeleteSportType")
        .WithSummary("Xóa môn thể thao")
        .WithDescription("Xóa môn thể thao nếu chưa có sân nào sử dụng. Nếu đang có sân sử dụng sẽ báo lỗi xung đột.")
        .WithTags(SportTypeTag)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateSportTypeRequest request,
            ISender sender,
            CancellationToken ct) =>
        {
            var command = new UpdateSportTypeCommand(
                id,
                request.Name,
                request.ImageId);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        // .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin" })
        .WithName("UpdateSportType")
        .WithSummary("Cập nhật thông tin, hình ảnh môn thể thao")
        .WithDescription("Cập nhật tên và hình ảnh đại diện của môn thể thao.")
        .WithTags(SportTypeTag)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

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
        // .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin" })
        .WithName("CreateSportType")
        .WithSummary("Tạo mới môn thể thao")
        .WithDescription("Tạo một môn thể thao mới kèm hình ảnh đại diện nếu có.")
        .WithTags(SportTypeTag)
        .Produces<Guid>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

