using CourtBooking.SharedKernel;

namespace CourtBooking.Application.Abstractions.Authentication;

public record ExternalAuthUserInfo(
    string Provider,
    string ProviderKey,
    string Email,
    string FullName,
    string? PictureUrl = null
);

public interface IExternalAuthService
{
    Task<Result<ExternalAuthUserInfo>> VerifyGoogleTokenAsync(string idToken, CancellationToken cancellationToken = default);
    Task<Result<ExternalAuthUserInfo>> VerifyFacebookTokenAsync(string accessToken, CancellationToken cancellationToken = default);
}
