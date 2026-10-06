using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.CreateFixedTimeBlock;
using CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.DeleteFixedTimeBlock;
using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.CreatePriceTableRule;
using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.DeletePriceTableRule;
using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.UpdatePriceTableRule;
using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.CreatePriceTable;
using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.DeletePriceTable;
using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.UpdatePriceTable;
using CourtBooking.Application.Features.V1.Pricing.Dtos;
using CourtBooking.Application.Features.V1.Pricing.Queries.GetPricingConfigByBranchId;
using CourtBooking.Application.Features.V1.Pricing.Queries.GetPricingConfigByCourtType;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Pricing;

public sealed class PricingEndpoints : IEndpointGroup
{
    private const string PricingTag = "Owner Pricing & Time Slots";

    public void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapApiV1Group("owner/pricing");

        // 1. Cấu hình giá & khung giờ theo Loại sân
        MapPricingConfig(group);

        // 2. Quản lý Bảng giá (PriceTable)
        MapPriceTables(group);

        // 3. Quản lý Quy tắc tính giá (PriceTableRule)
        MapPriceTableRules(group);

        // 4. Quản lý Khung giờ bắt buộc (FixedTimeBlock)
        MapFixedTimeBlocks(group);


        var publicGroup = app.MapApiV1Group("pricing");
        // 3. Xem cấu hình giá và loại sân công khai phục vụ đặt sân
        publicGroup.MapGet("/{id:guid}", async (
            Guid id,
            ISender sender,
            CancellationToken ct) =>
        {
            var result = await sender.Send(new GetPricingConfigByBranchIdQuery(id), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : result.ToProblemDetails();
        })
         .WithTags(PricingTag)
        .WithName("GetPublicBranchPricingConfig")
        .WithSummary("Lấy toàn bộ cấu hình giá và loại sân của chi nhánh cho đặt sân")
        .WithDescription("Trả về danh sách tất cả loại sân kèm các sân con khả dụng, khung giờ bắt buộc và bảng giá đang hoạt động.")
        .Produces<IReadOnlyList<CourtTypePricingConfigDto>>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static void MapPricingConfig(RouteGroupBuilder group)
    {
        // GET /api/v1/owner/pricing?branchId={branchId}&courtTypeId={courtTypeId}
        group.MapGet("/", async (
                [FromQuery] Guid branchId,
                [FromQuery] Guid courtTypeId,
                ISender sender,
                CancellationToken ct) =>
        {
            var query = new GetPricingConfigByCourtTypeQuery(branchId, courtTypeId);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
        .WithName("GetCourtTypePricingConfig")
        .WithSummary("Lấy toàn bộ cấu hình giá và khung giờ theo Loại sân")
        .WithDescription("Trả về thông tin Loại sân, danh sách khung giờ bắt buộc (đã giải mã thứ trong tuần) và danh sách bảng giá kèm các quy tắc giá bên trong. Dùng trực tiếp để render giao diện quản lý.")
        .WithTags(PricingTag)
        .Produces<CourtTypePricingConfigDto>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static void MapPriceTables(RouteGroupBuilder group)
    {
        // POST /api/v1/owner/pricing/price-tables?branchId={branchId}
        group.MapPost("/price-tables", async (
                [FromQuery] Guid branchId,
                [FromBody] CreatePriceTableRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new CreatePriceTableCommand(
                branchId,
                request.CourtTypeId,
                request.Name,
                request.DefaultPrice,
                request.IsActive);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Created($"/api/v1/owner/pricing?branchId={branchId}&courtTypeId={request.CourtTypeId}", new { id = result.Value })
                : result.ToProblemDetails();
        })
        .WithName("CreatePriceTable")
        .WithSummary("Tạo mới bảng giá cho Loại sân")
        .WithDescription("Tạo một bảng giá mới (ví dụ: Bảng giá tiêu chuẩn, Bảng giá HSSV) áp dụng cho một Loại sân cụ thể thuộc Chi nhánh.")
        .WithTags(PricingTag)
        .Produces(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // PUT /api/v1/owner/pricing/price-tables/{priceTableId}?branchId={branchId}
        group.MapPut("/price-tables/{priceTableId:guid}", async (
                Guid priceTableId,
                [FromQuery] Guid branchId,
                [FromBody] UpdatePriceTableRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new UpdatePriceTableCommand(
                branchId,
                priceTableId,
                request.Name,
                request.DefaultPrice,
                request.IsActive);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .WithName("UpdatePriceTable")
        .WithSummary("Cập nhật thông tin bảng giá")
        .WithDescription("Cập nhật tên, giá mặc định hoặc trạng thái hoạt động (kích hoạt/hủy kích hoạt) của bảng giá.")
        .WithTags(PricingTag)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // DELETE /api/v1/owner/pricing/price-tables/{priceTableId}?branchId={branchId}
        group.MapDelete("/price-tables/{priceTableId:guid}", async (
                Guid priceTableId,
                [FromQuery] Guid branchId,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new DeletePriceTableCommand(branchId, priceTableId);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .WithName("DeletePriceTable")
        .WithSummary("Xóa bảng giá")
        .WithDescription("Xóa hoàn toàn bảng giá và các quy tắc giá trực thuộc khỏi hệ thống.")
        .WithTags(PricingTag)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static void MapPriceTableRules(RouteGroupBuilder group)
    {
        // POST /api/v1/owner/pricing/price-tables/{priceTableId}/rules?branchId={branchId}
        group.MapPost("/price-tables/{priceTableId:guid}/rules", async (
                Guid priceTableId,
                [FromQuery] Guid branchId,
                [FromBody] CreatePriceTableRuleRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new CreatePriceTableRuleCommand(
                branchId,
                priceTableId,
                request.StartDate,
                request.EndDate,
                request.DayOfWeekFrom,
                request.DayOfWeekTo,
                request.StartTime,
                request.EndTime,
                request.FixedCustomerPrice,
                request.WalkInCustomerPrice);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Created($"/api/v1/owner/pricing/price-tables/{priceTableId}/rules/{result.Value}?branchId={branchId}", new { id = result.Value })
                : result.ToProblemDetails();
        })
        .WithName("CreatePriceTableRule")
        .WithSummary("Thêm quy tắc tính giá (khung giờ giá) vào bảng giá")
        .WithDescription("Thiết lập khoảng ngày áp dụng, thứ trong tuần (0 = Chủ nhật, 6 = Thứ bảy), khung giờ và đơn giá cho khách cố định / vãng lai. Tự động kiểm tra chống trùng lấn thời gian.")
        .WithTags(PricingTag)
        .Produces(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // PUT /api/v1/owner/pricing/price-tables/{priceTableId}/rules/{ruleId}?branchId={branchId}
        group.MapPut("/price-tables/{priceTableId:guid}/rules/{ruleId:guid}", async (
                Guid priceTableId,
                Guid ruleId,
                [FromQuery] Guid branchId,
                [FromBody] UpdatePriceTableRuleRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new UpdatePriceTableRuleCommand(
                branchId,
                priceTableId,
                ruleId,
                request.StartDate,
                request.EndDate,
                request.DayOfWeekFrom,
                request.DayOfWeekTo,
                request.StartTime,
                request.EndTime,
                request.FixedCustomerPrice,
                request.WalkInCustomerPrice);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .WithName("UpdatePriceTableRule")
        .WithSummary("Cập nhật quy tắc tính giá")
        .WithDescription("Điều chỉnh khung giờ, thứ áp dụng hoặc đơn giá. Hệ thống kiểm tra chống trùng lấn thời gian với các quy tắc khác.")
        .WithTags(PricingTag)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // DELETE /api/v1/owner/pricing/price-tables/{priceTableId}/rules/{ruleId}?branchId={branchId}
        group.MapDelete("/price-tables/{priceTableId:guid}/rules/{ruleId:guid}", async (
                Guid priceTableId,
                Guid ruleId,
                [FromQuery] Guid branchId,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new DeletePriceTableRuleCommand(branchId, priceTableId, ruleId);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .WithName("DeletePriceTableRule")
        .WithSummary("Xóa quy tắc tính giá")
        .WithDescription("Xóa một quy tắc tính giá khỏi bảng giá.")
        .WithTags(PricingTag)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }

    private static void MapFixedTimeBlocks(RouteGroupBuilder group)
    {
        // POST /api/v1/owner/pricing/fixed-time-blocks?branchId={branchId}
        group.MapPost("/fixed-time-blocks", async (
                [FromQuery] Guid branchId,
                [FromBody] CreateFixedTimeBlockRequest request,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new CreateFixedTimeBlockCommand(
                branchId,
                request.CourtTypeId,
                request.StartTime,
                request.EndTime,
                request.DaysOfWeek,
                request.CourtIds);

            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Created($"/api/v1/owner/pricing?branchId={branchId}&courtTypeId={request.CourtTypeId}", new { id = result.Value })
                : result.ToProblemDetails();
        })
        .WithName("CreateFixedTimeBlock")
        .WithSummary("Tạo khung giờ bắt buộc liền mạch (Fixed Time Block)")
        .WithDescription("Thiết lập khung giờ không được xé lẻ cho danh sách sân chỉ định và các thứ trong tuần (0 = Chủ nhật, 1 = Thứ hai,...). Tự động tính toán bitmask DaysOfWeekMask và kiểm tra chống trùng lấn.")
        .WithTags(PricingTag)
        .Produces(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict);

        // DELETE /api/v1/owner/pricing/fixed-time-blocks/{blockId}?branchId={branchId}
        group.MapDelete("/fixed-time-blocks/{blockId:guid}", async (
                Guid blockId,
                [FromQuery] Guid branchId,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new DeleteFixedTimeBlockCommand(branchId, blockId);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.NoContent()
                : result.ToProblemDetails();
        })
        .WithName("DeleteFixedTimeBlock")
        .WithSummary("Xóa khung giờ bắt buộc")
        .WithDescription("Hủy bỏ khung giờ bắt buộc và giải phóng các sân đã áp dụng.")
        .WithTags(PricingTag)
        .Produces(StatusCodes.Status204NoContent)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .ProducesProblem(StatusCodes.Status403Forbidden)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
