using System.ComponentModel.DataAnnotations;

namespace CourtBooking.Infrastructure.Storage;

public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    [Required(ErrorMessage = "Storage ServiceUrl is required.")]
    public required string ServiceUrl { get; init; }

    [Required(ErrorMessage = "Storage AccessKey is required.")]
    public required string AccessKey { get; init; }

    [Required(ErrorMessage = "Storage SecretKey is required.")]
    public required string SecretKey { get; init; }

    [Required(ErrorMessage = "Storage BucketName is required.")]
    public required string BucketName { get; init; }

    public bool ForcePathStyle { get; init; } = true;
}
