using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.Analytics.Dtos;
using CourtBooking.Application.Features.V1.Analytics.Queries.GetCourtOwnerRevenue;
using CourtBooking.Application.Features.V1.Analytics.Queries.GetSaaSSubscriptionRevenue;
using CourtBooking.Domain.Constants;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.Analytics;

public sealed class AnalyticsEndpoints : IEndpointGroup
{
    private const string OwnerAnalyticsTag = "Owner Analytics";

    public void Map(IEndpointRouteBuilder app)
    {
        // 1. Nhóm route cho Chủ Sân: /api/v1/owner/analytics
        var ownerGroup = app.MapApiV1Group("owner/analytics")
            .RequireAuthorization(policy => policy.RequireRole(RoleConstants.CourtOwner))
            .WithTags(OwnerAnalyticsTag);

        // GET /api/v1/owner/analytics/revenue — Thống kê doanh thu và vận hành cho Chủ Sân
        ownerGroup.MapGet("/revenue", GetCourtOwnerRevenueAsync)
            .WithName("GetCourtOwnerRevenue")
            .WithSummary("Thống kê doanh thu và vận hành cho Chủ Sân")
            .WithDescription("Thống kê tổng hợp doanh thu (tiền sân, dịch vụ, vé sự kiện, giảm giá, doanh thu ròng), chỉ số vận hành (lượt đặt online/POS, tỷ lệ hủy, tiền đơn hủy), phân bổ theo chi nhánh và chuỗi thời gian biểu đồ.")
            .Produces<CourtOwnerRevenueDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // 2. Nhóm route cho Quản trị viên (Admin): /api/v1/admin/analytics
        var adminGroup = app.MapApiV1Group("admin/analytics")
            .RequireAuthorization(policy => policy.RequireRole(RoleConstants.Admin))
            .WithTags("Admin Analytics");

        adminGroup.MapGet("/revenue", GetSaaSSubscriptionRevenueAsync)
            .WithName("GetAdminSaaSSubscriptionRevenue")
            .WithSummary("Thống kê doanh thu bán gói cước SaaS cho Quản trị viên")
            .WithDescription("Thống kê tổng doanh thu gói SaaS, số gói bán, số chủ sân hoạt động, tỷ lệ gia hạn và phân bổ theo gói/thời gian.")
            .Produces<SaaSSubscriptionRevenueDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        // 3. Nhóm route Legacy: /api/v1/analytics (Backward Compatibility)
        var legacyGroup = app.MapApiV1Group("analytics")
            .WithTags(OwnerAnalyticsTag);

        legacyGroup.MapGet("/court-owner/revenue", GetCourtOwnerRevenueAsync)
            .RequireAuthorization(policy => policy.RequireRole(RoleConstants.CourtOwner))
            .WithName("GetCourtOwnerRevenueLegacy")
            .ExcludeFromDescription();

        legacyGroup.MapGet("/saas-revenue", GetSaaSSubscriptionRevenueAsync)
            .RequireAuthorization(policy => policy.RequireRole(RoleConstants.Admin))
            .WithName("GetSaaSSubscriptionRevenue")
            .WithSummary("Thống kê doanh thu gói SaaS Admin Console")
            .Produces<SaaSSubscriptionRevenueDto>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> GetCourtOwnerRevenueAsync(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] Guid? branchId,
        [FromQuery] TimeGrouping groupBy = TimeGrouping.Day,
        ISender sender = default!,
        CancellationToken ct = default)
    {
        var query = new GetCourtOwnerRevenueQuery(fromDate, toDate, branchId, groupBy);
        var result = await sender.Send(query, ct);

        return result.IsSuccess
            ? Results.Ok(result.Value)
            : result.ToProblemDetails();
    }

    private static async Task<IResult> GetSaaSSubscriptionRevenueAsync(
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] TimeGrouping groupBy = TimeGrouping.Day,
        [FromQuery] Guid? packageId = null,
        ISender sender = default!,
        CancellationToken ct = default)
    {
        var query = new GetSaaSSubscriptionRevenueQuery(fromDate, toDate, groupBy, packageId);
        var result = await sender.Send(query, ct);

        return result.IsSuccess
            ? Results.Ok(result.Value)
            : result.ToProblemDetails();
    }
}
