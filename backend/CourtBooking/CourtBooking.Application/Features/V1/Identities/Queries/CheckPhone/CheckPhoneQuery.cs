using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Identities.Queries.CheckPhone;

public sealed record CheckPhoneResponse(bool Exists, string? PhoneNumber, string? FullName = null);

public sealed record CheckPhoneQuery(string PhoneNumber, AccountType AccountType = AccountType.Player)
    : IQuery<CheckPhoneResponse>;
