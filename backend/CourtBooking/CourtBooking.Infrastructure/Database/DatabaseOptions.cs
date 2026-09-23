using System.ComponentModel.DataAnnotations;

namespace CourtBooking.Infrastructure.Database;

public sealed class DatabaseOptions
{
    public const string SectionName = "ConnectionStrings";

    [Required(ErrorMessage = "DefaultConnection is required.")]
    public required string DefaultConnection { get; init; }

    [Range(1, 10)]
    public int MaxRetryCount { get; init; } = 3;

    [Range(5, 120)]
    public int CommandTimeoutSeconds { get; init; } = 30;
}
