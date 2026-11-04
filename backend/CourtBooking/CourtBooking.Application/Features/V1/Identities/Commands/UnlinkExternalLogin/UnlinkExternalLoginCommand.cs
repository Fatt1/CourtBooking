using CourtBooking.Application.Messaging;

namespace CourtBooking.Application.Features.V1.Identities.Commands.UnlinkExternalLogin;

public sealed record UnlinkExternalLoginCommand(
    string Provider) : ICommand;
