using System.Net.Http.Json;
using System.Text.Json;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.SharedKernel;
using Google.Apis.Auth;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CourtBooking.Infrastructure.Authentication;

internal sealed class ExternalAuthService(
    HttpClient httpClient,
    IOptions<ExternalAuthOptions> options,
    ILogger<ExternalAuthService> logger) : IExternalAuthService
{
    private readonly ExternalAuthOptions _options = options.Value;

    public async Task<Result<ExternalAuthUserInfo>> VerifyGoogleTokenAsync(string idToken, CancellationToken cancellationToken = default)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings();

            if (!string.IsNullOrWhiteSpace(_options.Google.ClientId))
            {
                settings.Audience = [_options.Google.ClientId];
            }

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            if (string.IsNullOrWhiteSpace(payload.Email))
            {
                return Result.Failure<ExternalAuthUserInfo>(new BadError("Tài khoản Google không cung cấp địa chỉ email."));
            }

            var userInfo = new ExternalAuthUserInfo(
                Provider: "Google",
                ProviderKey: payload.Subject,
                Email: payload.Email,
                FullName: payload.Name ?? payload.Email,
                PictureUrl: payload.Picture);

            return Result.Success(userInfo);
        }
        catch (InvalidJwtException ex)
        {
            logger.LogWarning(ex, "Xác thực Google ID Token thất bại.");
            return Result.Failure<ExternalAuthUserInfo>(new BadError("Mã xác thực Google không hợp lệ hoặc đã hết hạn."));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi xảy ra trong quá trình xác thực Google Token.");
            return Result.Failure<ExternalAuthUserInfo>(new BadError("Không thể xác thực với Google lúc này."));
        }
    }

    public async Task<Result<ExternalAuthUserInfo>> VerifyFacebookTokenAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        try
        {
            var url = $"https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.width(200).height(200)&access_token={Uri.EscapeDataString(accessToken)}";
            var response = await httpClient.GetAsync(url, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Facebook Graph API trả về mã lỗi: {StatusCode}", response.StatusCode);
                return Result.Failure<ExternalAuthUserInfo>(new BadError("Mã xác thực Facebook không hợp lệ hoặc đã hết hạn."));
            }

            using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
            var root = document.RootElement;

            if (root.TryGetProperty("error", out _))
            {
                return Result.Failure<ExternalAuthUserInfo>(new BadError("Mã xác thực Facebook không hợp lệ."));
            }

            var id = root.GetProperty("id").GetString();
            if (string.IsNullOrWhiteSpace(id))
            {
                return Result.Failure<ExternalAuthUserInfo>(new BadError("Không tìm thấy thông tin ID người dùng từ Facebook."));
            }

            var name = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : "Facebook User";
            
            string email;
            if (root.TryGetProperty("email", out var emailProp) && !string.IsNullOrWhiteSpace(emailProp.GetString()))
            {
                email = emailProp.GetString()!;
            }
            else
            {
                // Fallback nếu tài khoản Facebook đăng ký bằng SĐT không có email công khai
                email = $"{id}@facebook.local";
            }

            string? pictureUrl = null;
            if (root.TryGetProperty("picture", out var pictureProp) &&
                pictureProp.TryGetProperty("data", out var dataProp) &&
                dataProp.TryGetProperty("url", out var urlProp))
            {
                pictureUrl = urlProp.GetString();
            }

            var userInfo = new ExternalAuthUserInfo(
                Provider: "Facebook",
                ProviderKey: id,
                Email: email,
                FullName: name ?? "Facebook User",
                PictureUrl: pictureUrl);

            return Result.Success(userInfo);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi xảy ra trong quá trình xác thực Facebook Token.");
            return Result.Failure<ExternalAuthUserInfo>(new BadError("Không thể xác thực với Facebook lúc này."));
        }
    }
}
