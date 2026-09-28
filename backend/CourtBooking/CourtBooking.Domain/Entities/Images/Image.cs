using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Images;

/// <summary>
/// Tập trung quản lý file ảnh từ storage providers.
/// Aggregate Root.
/// </summary>
public class Image : AggregateRoot<Guid>
{
    private Image() { } // EF Core

    public string Url { get; private set; } = null!;
    public StorageProvider StorageProvider { get; private set; }

    /// <summary>public_id / object key - dùng để gọi API xóa file thật trên storage</summary>
    public string StorageKey { get; private set; } = null!;

    public ImageStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? AttachedAt { get; private set; }

    // --- Factory ---
    public static Image Create(string url, StorageProvider storageProvider, string storageKey)
    {
        return new Image
        {
            Id = Guid.NewGuid(),
            Url = url,
            StorageProvider = storageProvider,
            StorageKey = storageKey,
            Status = ImageStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
    }

    // --- Domain Methods ---
    public void MarkAsAttached() { }
    public void MarkAsPending() { }
}
