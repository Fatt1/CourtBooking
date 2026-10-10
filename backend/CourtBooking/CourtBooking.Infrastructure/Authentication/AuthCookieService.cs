using CourtBooking.Application.Abstractions.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace CourtBooking.Infrastructure.Authentication;

internal sealed class AuthCookieService(
    IHttpContextAccessor httpContextAccessor,
    IOptions<JwtOptions> options) : IAuthCookieService
{
    private readonly JwtOptions _options = options.Value;

    public void SetRefreshTokenCookie(string refreshToken, DateTime expiresAt)
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return;
        }

        var isHttps = httpContext.Request.IsHttps;
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,                                     // Chống XSS (JS không đọc được)
            Secure = isHttps,                                   // HTTPS only trong production / HTTPS dev
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax, // None + Secure khi gọi API cross-origin HTTPS
            Expires = expiresAt,
            IsEssential = true,                                  // Cookie bắt buộc cho authentication
            Path = "/"
        };

        httpContext.Response.Cookies.Append(_options.CookieName, refreshToken, cookieOptions);
    }

    public string? GetRefreshTokenFromCookie()
    {
        return httpContextAccessor.HttpContext?.Request.Cookies[_options.CookieName];
    }

    public void DeleteRefreshTokenCookie()
    {
        var httpContext = httpContextAccessor.HttpContext;
        if (httpContext is null)
        {
            return;
        }

        var isHttps = httpContext.Request.IsHttps;
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddDays(-1),
            Path = "/"
        };

        httpContext.Response.Cookies.Delete(_options.CookieName, cookieOptions);
    }
}
