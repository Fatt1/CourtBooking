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

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,                                     // Chống XSS (JS không đọc được)
            Secure = httpContext.Request.IsHttps,               // HTTPS only trong production
            SameSite = SameSiteMode.Lax,                         // Bảo vệ chống CSRF, hỗ trợ SPA
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

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = httpContext.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddDays(-1),
            Path = "/"
        };

        httpContext.Response.Cookies.Delete(_options.CookieName, cookieOptions);
    }
}
