using CourtBooking.Domain.Entities.Users;

namespace CourtBooking.Application.Abstractions.Authentication;

public interface IJwtTokenService
{
    string GenerateAccessToken(ApplicationUser user, IEnumerable<string> roles);
    string GenerateRefreshToken();
}
