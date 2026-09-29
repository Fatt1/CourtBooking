using CourtBooking.Domain.Abstractions;
using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Entities.Images;

/// <summary>
/// Tập trung quản lý file ảnh từ storage providers.
/// </summary>
public class Image : EntityBase<Guid>
{
    public Image() { }

    public StorageProvider StorageProvider { get; set; }

    /// <summary>public_id / object key - dùng để gọi API xóa file thật trên storage</summary>
    public string StorageKey { get; set; } = null!;

    public ImageStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AttachedAt { get; set; }
}
