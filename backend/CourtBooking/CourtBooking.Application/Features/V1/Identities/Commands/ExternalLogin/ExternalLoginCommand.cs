using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Identities.Commands.ExternalLogin;

public sealed record ExternalLoginCommand(
    string Provider,
    string Token,
    AccountType ExpectedAccountType = AccountType.Player) : ICommand<LoginResponse>;
