using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Identities.Commands.LinkExternalLogin;

public sealed record LinkExternalLoginCommand(
    string Provider,
    string Token) : ICommand;
