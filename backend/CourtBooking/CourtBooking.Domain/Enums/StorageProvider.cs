namespace CourtBooking.Domain.Enums;

/// <summary>
/// 1 = Cloudinary, 2 = S3, 3 = AzureBlob
/// </summary>
public enum StorageProvider
{
    Cloudinary = 1,
    S3 = 2,
    AzureBlob = 3
}
