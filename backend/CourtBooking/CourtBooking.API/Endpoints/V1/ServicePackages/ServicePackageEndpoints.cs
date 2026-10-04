using CourtBooking.API.Extensions;
using CourtBooking.Application.Features.V1.ServicePackages.Commands.CreateServicePackage;
using CourtBooking.Application.Features.V1.ServicePackages.Commands.SubscribeServicePackage;
using CourtBooking.Application.Features.V1.ServicePackages.Dtos;
using CourtBooking.Application.Features.V1.ServicePackages.Queries.GetCurrentSubscription;
using CourtBooking.Application.Features.V1.ServicePackages.Queries.GetServicePackages;
using CourtBooking.Application.Features.V1.ServicePackages.Queries.GetSubscriptionHistory;
using CourtBooking.SharedKernel.Extensions;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CourtBooking.API.Endpoints.V1.ServicePackages;

public sealed class ServicePackageEndpoints : IEndpointGroup
{
    private const string PackageTag = "ServicePackages";

    public void Map(IEndpointRouteBuilder app)
    {
        // Nhóm route gốc: /api/v1/service-packages
        var group = app.MapApiV1Group("service-packages");

        // 1. GET /api/v1/service-packages — Lấy danh sách toàn bộ gói cước SaaS
        group.MapGet("/", async (
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

        // 2. GET /api/v1/service-packages/my-subscription — Xem thông tin thuê bao của Chủ sân hiện tại
        group.MapGet("/my-subscription", async (
                ISender sender,
                CancellationToken ct) =>
        {
            var query = new GetCurrentSubscriptionQuery();
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .RequireAuthorization()
            .WithName("GetMySubscription")
            .WithSummary("Xem thông tin gói cước hiện tại của Chủ sân")
            .WithDescription("Yêu cầu đăng nhập tài khoản Chủ sân. Trả về thông tin gói đang sử dụng, ngày bắt đầu, ngày hết hạn và trạng thái còn hạn (IsActive).")
            .WithTags(PackageTag)
            .Produces<SubscriptionDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 3. POST /api/v1/service-packages/{id:guid}/subscribe — Đăng ký mua hoặc gia hạn gói cước
        group.MapPost("/{id:guid}/subscribe", async (
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
            .RequireAuthorization()
            .WithName("SubscribeServicePackage")
            .WithSummary("Chủ sân đăng ký mua hoặc gia hạn gói cước SaaS")
            .WithDescription("Tự động tính ngày hiệu lực nối tiếp sau ngày hết hạn cũ nếu gói hiện tại vẫn còn hạn theo SRS mục 1.2.")
            .WithTags(PackageTag)
            .Produces<SubscriptionDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);

        // 4. POST /api/v1/service-packages — Tạo gói dịch vụ SaaS mới (Dành cho Admin)
        group.MapPost("/", async (
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
            .RequireAuthorization()
            .WithName("CreateServicePackage")
            .WithSummary("Quản trị viên tạo gói dịch vụ SaaS mới")
            .WithDescription("Thêm gói cước mới vào hệ thống (ví dụ: Gói Basic, Pro, VIP).")
            .WithTags(PackageTag)
            .Produces<ServicePackageDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        // 5. GET /api/v1/service-packages/subscriptions/history — Lịch sử đăng ký của các chủ sân (Admin Console)
        group.MapGet("/subscriptions/history", async (
                [FromQuery] string? search,
                [FromQuery] string? status,
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 10,
                ISender sender = default!,
                CancellationToken ct = default) =>
        {
            var query = new GetSubscriptionHistoryQuery(search, status, page, pageSize);
            var result = await sender.Send(query, ct);

            return result.IsSuccess
                ? Results.Ok(result.Value)
                : result.ToProblemDetails();
        })
            .RequireAuthorization()
            .WithName("GetSubscriptionHistory")
            .WithSummary("Lấy lịch sử đăng ký gói cước của các chủ sân")
            .WithDescription("Trả về bảng danh sách thuê bao có phân trang, lọc theo trạng thái (Hoạt động, Sắp hết hạn, Hết hạn, Tạm dừng) kèm số lượng badge sắp hết hạn trong 7 ngày.")
            .WithTags(PackageTag)
            .Produces<SubscriptionHistoryResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
