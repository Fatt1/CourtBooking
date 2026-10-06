using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.Analytics.Dtos;
using CourtBooking.Application.Features.V1.Analytics.Queries.GetCourtOwnerRevenue;
using CourtBooking.Application.Features.V1.Analytics.Queries.GetSaaSSubscriptionRevenue;
using CourtBooking.Application.Features.V1.Analytics.Queries.GetSystemUtilizationStatistics;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Analytics;

public sealed class AnalyticsEndpoints : IEndpointGroup
{
    private const string AnalyticsTag = "Analytics";

    public void Map(IEndpointRouteBuilder app)
    {
        // Nhóm route gốc: /api/v1/analytics
        var group = app.MapApiV1Group("analytics");

        // 1. GET /api/v1/analytics/saas-revenue — Thống kê tổng doanh thu từ việc bán gói cước SaaS
        group.MapGet("/saas-revenue", async (
                [FromQuery] DateOnly? fromDate,
                [FromQuery] DateOnly? toDate,
                [FromQuery] TimeGrouping groupBy = TimeGrouping.Month,
                [FromQuery] Guid? packageId = null,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetSaaSSubscriptionRevenueQuery(fromDate, toDate, groupBy, packageId);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .RequireAuthorization()
            .WithName("GetSaaSSubscriptionRevenue")
            .WithSummary("Thống kê doanh thu bán gói cước SaaS")
            .WithDescription("Thống kê tổng doanh thu từ việc bán gói cước SaaS cho các chủ sân theo ngày/tháng/năm hoặc theo khoảng thời gian tùy chọn. Bao gồm KPI tổng, phân tích theo gói cước, biểu đồ chuỗi thời gian và % tăng trưởng so với kỳ trước.")
            .WithTags(AnalyticsTag)
            .Produces<SaaSSubscriptionRevenueDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 2. GET /api/v1/analytics/system-utilization — Thống kê cơ sở sân, người chơi hoạt động & tỷ lệ sử dụng hệ thống
        group.MapGet("/system-utilization", async (
                [FromQuery] DateOnly? fromDate,
                [FromQuery] DateOnly? toDate,
                [FromQuery] Guid? branchId,
                [FromQuery] Guid? sportTypeId,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetSystemUtilizationStatisticsQuery(fromDate, toDate, branchId, sportTypeId);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .RequireAuthorization()
            .WithName("GetSystemUtilizationStatistics")
            .WithSummary("Thống kê cơ sở sân, người chơi hoạt động và tỷ lệ sử dụng hệ thống")
            .WithDescription("Thống kê tổng số lượng cơ sở sân (chi nhánh, sân con, trạng thái, môn thể thao), số lượng người chơi hoạt động trong kỳ và tính toán công suất, tỷ lệ sử dụng hệ thống (Overall Utilization Rate) kèm biểu đồ phân bổ giờ và top khung giờ cao điểm.")
            .WithTags(AnalyticsTag)
            .Produces<SystemUtilizationStatisticsDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 3. GET /api/v1/analytics/court-owner/revenue — Thống kê doanh thu và vận hành cho Chủ Sân
        group.MapGet("/court-owner/revenue", async (
                [FromQuery] DateOnly? fromDate,
                [FromQuery] DateOnly? toDate,
                [FromQuery] Guid? branchId,
                [FromQuery] TimeGrouping groupBy = TimeGrouping.Day,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetCourtOwnerRevenueQuery(fromDate, toDate, branchId, groupBy);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .WithName("GetCourtOwnerRevenueStatistics")
            .WithSummary("Thống kê doanh thu và vận hành cho Chủ Sân")
            .WithDescription("Thống kê tổng hợp doanh thu (tiền sân, dịch vụ, vé sự kiện, giảm giá, doanh thu ròng), chỉ số vận hành (lượt đặt online/POS, tỷ lệ hủy, tiền đơn hủy), phân bổ theo chi nhánh và chuỗi thời gian biểu đồ.")
            .WithTags(AnalyticsTag)
            .Produces<CourtOwnerRevenueDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
