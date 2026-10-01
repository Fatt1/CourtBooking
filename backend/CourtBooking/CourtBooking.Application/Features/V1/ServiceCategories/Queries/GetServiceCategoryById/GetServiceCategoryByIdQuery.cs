using CourtBooking.Application.Features.V1.ServiceCategories.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.ServiceCategories.Queries.GetServiceCategoryById;

public sealed record GetServiceCategoryByIdQuery(Guid Id) : IQuery<ServiceCategoryDto>;
