using CourtBooking.Application.Features.V1.RetailOrders.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.RetailOrders.Queries.GetRetailOrderSummary;

public sealed record GetRetailOrderSummaryQuery(Guid? BranchId, DateOnly? FromDate, DateOnly? ToDate)
    : IQuery<RetailOrderSummaryDto>;
