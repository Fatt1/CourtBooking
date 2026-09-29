namespace CourtBooking.Application.Abstractions.Authentication;

public interface IUserContext
{
    Guid UserId { get; }
    string? Email { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
}
