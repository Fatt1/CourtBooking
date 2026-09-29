using System.ComponentModel.DataAnnotations;

namespace CourtBooking.Infrastructure.Authentication;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    public string Issuer { get; set; } = string.Empty;

    [Required]
    public string Audience { get; set; } = string.Empty;

    [Required]
    [MinLength(32, ErrorMessage = "Secret key must be at least 32 characters (256 bits).")]
    public string SecretKey { get; set; } = string.Empty;

    [Range(1, 1440)]
    public int AccessTokenExpirationInMinutes { get; set; } = 60;

    [Range(1, 365)]
    public int RefreshTokenExpirationInDays { get; set; } = 30;

    public string CookieName { get; set; } = "refreshToken";
}
