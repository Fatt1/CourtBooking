using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Application.Features.V1.Identities.Commands.UpdatePlayerProfile;

public sealed record UpdatePlayerProfileCommand(
    string FullName,
    string Email,
    string PhoneNumber,
    Gender Gender,
    DateOnly? DateOfBirth) : ICommand;
