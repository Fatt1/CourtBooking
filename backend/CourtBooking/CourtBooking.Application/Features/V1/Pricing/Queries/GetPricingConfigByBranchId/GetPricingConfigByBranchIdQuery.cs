using CourtBooking.Application.Features.V1.Pricing.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Pricing.Queries.GetPricingConfigByBranchId;

/// <summary>
/// Truy vấn công khai lấy toàn bộ cấu hình giá, loại sân, sân con và khung giờ bắt buộc của tất cả các loại sân trong một chi nhánh.
/// Chỉ trả về các dữ liệu đang hoạt động (Active) phục vụ cho giao diện đặt sân của khách hàng.
/// </summary>
public sealed record GetPricingConfigByBranchIdQuery(
    Guid BranchId) : IQuery<IReadOnlyList<CourtTypePricingConfigDto>>;
