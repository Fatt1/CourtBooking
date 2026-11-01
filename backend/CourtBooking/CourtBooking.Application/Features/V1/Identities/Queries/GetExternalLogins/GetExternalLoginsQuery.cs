using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Identities.Queries.GetExternalLogins;

public sealed record GetExternalLoginsQuery : IQuery<IReadOnlyList<UserExternalLoginDto>>;
