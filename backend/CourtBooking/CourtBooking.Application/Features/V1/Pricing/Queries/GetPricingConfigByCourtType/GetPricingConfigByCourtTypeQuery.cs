using CourtBooking.Application.Features.V1.Pricing.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Pricing.Queries.GetPricingConfigByCourtType;

/// <summary>
/// Truy vấn lấy toàn bộ cấu hình giá và khung giờ theo Loại sân của chi nhánh.
/// </summary>
public sealed record GetPricingConfigByCourtTypeQuery(
    Guid BranchId,
    Guid CourtTypeId) : IQuery<CourtTypePricingConfigDto>;
