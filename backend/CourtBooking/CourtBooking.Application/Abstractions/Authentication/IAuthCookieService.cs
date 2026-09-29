namespace CourtBooking.Application.Abstractions.Authentication;

public interface IAuthCookieService
{
    void SetRefreshTokenCookie(string refreshToken, DateTime expiresAt);
    string? GetRefreshTokenFromCookie();
    void DeleteRefreshTokenCookie();
}
