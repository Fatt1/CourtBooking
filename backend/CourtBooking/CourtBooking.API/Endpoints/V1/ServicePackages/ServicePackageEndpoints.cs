using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.ServicePackages.Commands.CreateServicePackage;
using CourtBooking.Application.Features.V1.ServicePackages.Commands.DeleteServicePackage;
using CourtBooking.Application.Features.V1.ServicePackages.Commands.SubscribeServicePackage;
using CourtBooking.Application.Features.V1.ServicePackages.Commands.UpdateServicePackage;
using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Features.V1.ServicePackages.Queries.GetCurrentSubscription;
using CourtBooking.Application.Features.V1.ServicePackages.Queries.GetOwnerSubscriptionMe;
using CourtBooking.Application.Features.V1.ServicePackages.Queries.GetServicePackages;
using CourtBooking.Application.Features.V1.ServicePackages.Queries.GetSubscriptionHistory;
using CourtBooking.Domain.Constants;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.ServicePackages;

public sealed class ServicePackageEndpoints : IEndpointGroup
{
    private const string PackageTag = "ServicePackages";

    public void Map(IEndpointRouteBuilder app)
    {
        // =========================================================================
        // 1. NHÓM PUBLIC: /api/v1/service-packages
        // =========================================================================
        var publicGroup = app.MapApiV1Group("service-packages");

        // 1.1 GET /api/v1/service-packages — Lấy danh sách toàn bộ gói cước SaaS
        publicGroup.MapGet("/", async (
                ISender sender,
                CancellationToken ct) =>
        {
            var query = new GetServicePackagesQuery();
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .AllowAnonymous()
            .WithName("GetServicePackages")
            .WithSummary("Lấy danh sách các gói dịch vụ SaaS")
            .WithDescription("Dành cho Chủ sân hoặc Khách vãng lai xem bảng giá và danh sách quyền lợi các gói cước.")
            .WithTags(PackageTag)
            .Produces<List<ServicePackageDto>>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest);

        // 1.2 GET /api/v1/service-packages/my-subscription — Xem thông tin thuê bao của Chủ sân hiện tại (Legacy fallback)
        publicGroup.MapGet("/my-subscription", async (
                ISender sender,
                CancellationToken ct) =>
        {
            var query = new GetCurrentSubscriptionQuery();
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .RequireAuthorization(policy => policy.RequireRole(RoleConstants.CourtOwner))
            .WithName("GetMySubscription")
            .WithSummary("Xem thông tin gói cước hiện tại của Chủ sân")
            .WithDescription("Yêu cầu đăng nhập tài khoản Chủ sân. Trả về thông tin gói đang sử dụng.")
            .WithTags(PackageTag)
            .Produces<SubscriptionDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 1.3 POST /api/v1/service-packages/{id:guid}/subscribe — Đăng ký mua hoặc gia hạn gói cước
        publicGroup.MapPost("/{id:guid}/subscribe", async (
                [FromRoute] Guid id,
                ISender sender,
                CancellationToken ct) =>
        {
            var command = new SubscribeServicePackageCommand(id);
            var result = await sender.Send(command, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .RequireAuthorization(policy => policy.RequireRole(RoleConstants.CourtOwner))
            .WithName("SubscribeServicePackagePublic")
            .WithSummary("Chủ sân đăng ký mua hoặc gia hạn gói cước SaaS")
            .WithTags(PackageTag)
            .Produces<SubscriptionDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // =========================================================================
        // 2. NHÓM ADMIN: /api/v1/admin/service-packages (Thêm, Xóa, Sửa, Lịch sử hệ thống)
        // Hỗ trợ cả alias đường dẫn /admin/service-packges theo yêu cầu
        // =========================================================================
        var adminGroups = new[]
        {
            app.MapApiV1Group("admin/service-packages"),
            app.MapApiV1Group("admin/service-packges")
        };

        foreach (var adminGroup in adminGroups)
        {
            // 2.1 POST /api/v1/admin/service-packages — Tạo gói dịch vụ SaaS mới
            adminGroup.MapPost("/", async (
                    [FromBody] CreateServicePackageRequest request,
                    ISender sender,
                    CancellationToken ct) =>
            {
                var command = new CreateServicePackageCommand(
                    request.Name,
                    request.Price,
                    request.Description,
                    request.DurationMonths);

                var result = await sender.Send(command, ct);

                return result.IsSuccess
                    ? Results.Ok(result.Value)
                    : result.ToProblemDetails();
            })
                .RequireAuthorization(policy => policy.RequireRole(RoleConstants.Admin))
                .WithSummary("Quản trị viên tạo gói dịch vụ SaaS mới")
                .WithDescription("Thêm gói cước mới vào hệ thống (ví dụ: Gói Basic, Pro, VIP).")
                .WithTags(PackageTag)
                .Produces<ServicePackageDto>(StatusCodes.Status200OK)
                .ProducesProblem(StatusCodes.Status400BadRequest)
                .ProducesProblem(StatusCodes.Status401Unauthorized);

            // 2.2 PUT /api/v1/admin/service-packages/{id:guid} — Chỉnh sửa gói dịch vụ SaaS
            adminGroup.MapPut("/{id:guid}", async (
                    [FromRoute] Guid id,
                    [FromBody] UpdateServicePackageRequest request,
                    ISender sender,
                    CancellationToken ct) =>
            {
                var command = new UpdateServicePackageCommand(
                    id,
                    request.Name,
                    request.Price,
                    request.Description,
                    request.DurationMonths);

                var result = await sender.Send(command, ct);

                return result.IsSuccess
                    ? Results.Ok(result.Value)
                    : result.ToProblemDetails();
            })
                .RequireAuthorization(policy => policy.RequireRole(RoleConstants.Admin))
                .WithSummary("Quản trị viên cập nhật gói dịch vụ SaaS")
                .WithDescription("Cập nhật tên, giá, mô tả và thời hạn của gói dịch vụ.")
                .WithTags(PackageTag)
                .Produces<ServicePackageDto>(StatusCodes.Status200OK)
                .ProducesProblem(StatusCodes.Status400BadRequest)
                .ProducesProblem(StatusCodes.Status401Unauthorized)
                .ProducesProblem(StatusCodes.Status404NotFound);

            // 2.3 DELETE /api/v1/admin/service-packages/{id:guid} — Xóa gói dịch vụ SaaS
            adminGroup.MapDelete("/{id:guid}", async (
                    [FromRoute] Guid id,
                    ISender sender,
                    CancellationToken ct) =>
            {
                var command = new DeleteServicePackageCommand(id);
                var result = await sender.Send(command, ct);

                return result.IsSuccess
                    ? Results.Ok(new { message = "Xóa gói dịch vụ thành công." })
                    : result.ToProblemDetails();
            })
                .RequireAuthorization(policy => policy.RequireRole(RoleConstants.Admin))
                .WithSummary("Quản trị viên xóa gói dịch vụ SaaS")
                .WithDescription("Chỉ cho phép xóa gói cước nếu chưa có chủ sân nào đăng ký sử dụng.")
                .WithTags(PackageTag)
                .Produces(StatusCodes.Status200OK)
                .ProducesProblem(StatusCodes.Status400BadRequest)
                .ProducesProblem(StatusCodes.Status401Unauthorized)
                .ProducesProblem(StatusCodes.Status404NotFound)
                .ProducesProblem(StatusCodes.Status409Conflict);

            // 2.4 GET /api/v1/admin/service-packages/subscriptions/history — Lịch sử đăng ký của các chủ sân (Admin Console)
            adminGroup.MapGet("/subscriptions/history", async (
                    [FromQuery] string? search,
                    [FromQuery] int page = 1,
                    [FromQuery] int pageSize = 10,
                    ISender sender = default!,
                    CancellationToken ct = default) =>
            {
                var query = new GetSubscriptionHistoryQuery(search, page, pageSize);
                var result = await sender.Send(query, ct);

                return result.IsSuccess
                    ? Results.Ok(result.Value)
                    : result.ToProblemDetails();
            })
                .RequireAuthorization(policy => policy.RequireRole(RoleConstants.Admin))
                .WithSummary("Lấy lịch sử đăng ký gói cước của các chủ sân (Admin Console)")
                .WithDescription("Trả về bảng danh sách lịch sử thuê bao có phân trang.")
                .WithTags(PackageTag)
                .Produces<SubscriptionHistoryResponse>(StatusCodes.Status200OK)
                .ProducesProblem(StatusCodes.Status400BadRequest)
                .ProducesProblem(StatusCodes.Status401Unauthorized);
        }

        // =========================================================================
        // 3. NHÓM OWNER: /api/v1/owner/service-packages/me (Xem gói hiện tại + Lịch sử gói của chủ sân)
        // Hỗ trợ cả alias đường dẫn /owner/service-pageke/me và /owner/service-package/me
        // =========================================================================
        var ownerGroups = new[]
        {
            app.MapApiV1Group("owner/service-packages"),
            app.MapApiV1Group("owner/service-package"),
            app.MapApiV1Group("owner/service-pageke")
        };

        foreach (var ownerGroup in ownerGroups)
        {
            // 3.1 GET /api/v1/owner/service-packages/me — Xem gói dịch vụ hiện tại và lịch sử gói dịch vụ của Chủ sân
            ownerGroup.MapGet("/me", async (
                    ISender sender,
                    CancellationToken ct) =>
            {
                var query = new GetOwnerSubscriptionMeQuery();
                var result = await sender.Send(query, ct);

                return result.IsSuccess
                    ? Results.Ok(result.Value)
                    : result.ToProblemDetails();
            })
                .RequireAuthorization(policy => policy.RequireRole(RoleConstants.CourtOwner))
                .WithSummary("Xem gói dịch vụ hiện tại và lịch sử gói dịch vụ của Chủ sân")
                .WithDescription("Trả về gói cước đang hoạt động (CurrentSubscription) kèm toàn bộ danh sách lịch sử đăng ký, đổi gói, gia hạn của chính chủ sân (History).")
                .WithTags(PackageTag)
                .Produces<OwnerSubscriptionMeResponse>(StatusCodes.Status200OK)
                .ProducesProblem(StatusCodes.Status401Unauthorized);

            // 3.2 POST /api/v1/owner/service-packages/{id:guid}/subscribe — Chủ sân đăng ký hoặc gia hạn gói cước
            ownerGroup.MapPost("/{id:guid}/subscribe", async (
                    [FromRoute] Guid id,
                    ISender sender,
                    CancellationToken ct) =>
            {
                var command = new SubscribeServicePackageCommand(id);
                var result = await sender.Send(command, ct);

                return result.IsSuccess
                    ? Results.Ok(result.Value)
                    : result.ToProblemDetails();
            })
                .RequireAuthorization(policy => policy.RequireRole(RoleConstants.CourtOwner))
                .WithSummary("Chủ sân đăng ký mua hoặc gia hạn gói cước SaaS")
                .WithTags(PackageTag)
                .Produces<SubscriptionDto>(StatusCodes.Status200OK)
                .ProducesProblem(StatusCodes.Status400BadRequest)
                .ProducesProblem(StatusCodes.Status401Unauthorized)
                .ProducesProblem(StatusCodes.Status404NotFound);
        }
    }
}
