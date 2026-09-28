using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Chi nhánh sân (Branch) - Aggregate Root NHỎ.
/// Branch chỉ quản lý thông tin của chính nó và hình ảnh.
/// CourtType là Aggregate Root riêng, tham chiếu Branch qua BranchId.
/// </summary>
public class Branch : AggregateRoot<Guid>, IAuditable
{
    private Branch() { } // EF Core

    private readonly List<BranchImage> _images = [];

    public Guid CourtOwnerId { get; private set; }
    public Guid SportTypeId { get; private set; }
    public string Name { get; private set; } = null!;
    public string GgMapUrl { get; private set; } = null!;
    public string Province { get; private set; } = null!;
    public string District { get; private set; } = null!;
    public string Street { get; private set; } = null!;
    public decimal? Latitude { get; private set; }
    public decimal? Longitude { get; private set; }
    public bool IsActive { get; private set; }
    public int ReviewTotal { get; private set; }
    public TimeOnly OpenTime { get; private set; }
    public TimeOnly CloseTime { get; private set; }
    public string? Policy { get; private set; }
    public Guid QrImageId { get; private set; }
    public string AccountNumber { get; private set; } = null!;
    public string AccountName { get; private set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Branch chỉ own BranchImage — CourtType là aggregate riêng
    public IReadOnlyList<BranchImage> Images => _images.AsReadOnly();

    // --- Factory ---
    public static Branch Create(
        Guid courtOwnerId,
        Guid sportTypeId,
        string name,
        string ggMapUrl,
        string province,
        string district,
        string street,
        TimeOnly openTime,
        TimeOnly closeTime,
        Guid qrImageId,
        string accountNumber,
        string accountName)
    {
        return new Branch
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = courtOwnerId,
            SportTypeId = sportTypeId,
            Name = name,
            GgMapUrl = ggMapUrl,
            Province = province,
            District = district,
            Street = street,
            OpenTime = openTime,
            CloseTime = closeTime,
            QrImageId = qrImageId,
            AccountNumber = accountNumber,
            AccountName = accountName,
            IsActive = true,
            ReviewTotal = 0
        };
    }

    // --- Domain Methods ---
    public void UpdateInfo(string name, string province, string district, string street, string ggMapUrl) { }
    public void UpdateBankInfo(string accountNumber, string accountName, Guid qrImageId) { }
    public void UpdateOpenHours(TimeOnly openTime, TimeOnly closeTime) { }
    public void UpdateLocation(decimal latitude, decimal longitude) { }
    public void UpdatePolicy(string? policy) { }
    public void Activate() { }
    public void Deactivate() { }
    public void AddImage(Guid imageId, int displayOrder) { }
    public void RemoveImage(Guid imageId) { }
    public void IncrementReviewTotal() { }
}
