using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Enums;

namespace Application.UnitTests.Common.Builders;

public sealed class BranchBuilder
{
    private Guid _id = Guid.NewGuid();
    private Guid _courtOwnerId = Guid.NewGuid();
    private string _name = "Chi nhánh Test";
    private string _hotline = "0900000000";
    private string _province = "TP.HCM";
    private string _district = "Quận 1";
    private string _street = "123 Lê Lợi";
    private TimeOnly _openTime = new(6, 0);
    private TimeOnly _closeTime = new(22, 0);
    private string _accountNumber = "123456789";
    private string _accountName = "NGUYEN VAN A";
    private bool _isActive = true;
    private Image? _qrImage;

    public BranchBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public BranchBuilder WithCourtOwnerId(Guid courtOwnerId)
    {
        _courtOwnerId = courtOwnerId;
        return this;
    }

    public BranchBuilder WithName(string name)
    {
        _name = name;
        return this;
    }

    public BranchBuilder WithHotline(string hotline)
    {
        _hotline = hotline;
        return this;
    }

    public BranchBuilder WithAddress(string province, string district, string street)
    {
        _province = province;
        _district = district;
        _street = street;
        return this;
    }

    public BranchBuilder WithAccount(string accountNumber, string accountName)
    {
        _accountNumber = accountNumber;
        _accountName = accountName;
        return this;
    }

    public BranchBuilder WithOperatingHours(TimeOnly open, TimeOnly close)
    {
        _openTime = open;
        _closeTime = close;
        return this;
    }

    public BranchBuilder WithActive(bool isActive)
    {
        _isActive = isActive;
        return this;
    }

    public BranchBuilder WithQrImage(string storageKey = "branches/qr/test.png")
    {
        _qrImage = new Image
        {
            Id = Guid.NewGuid(),
            StorageKey = storageKey,
            StorageProvider = StorageProvider.S3,
            Status = ImageStatus.Attached,
            CreatedAt = DateTime.UtcNow,
            AttachedAt = DateTime.UtcNow
        };
        return this;
    }

    public Branch Build()
    {
        var qr = _qrImage ?? new Image
        {
            Id = Guid.NewGuid(),
            StorageKey = "branches/qr/default.png",
            StorageProvider = StorageProvider.S3,
            Status = ImageStatus.Attached
        };

        return new Branch
        {
            Id = _id,
            CourtOwnerId = _courtOwnerId,
            Name = _name,
            Hotline = _hotline,
            Province = _province,
            District = _district,
            Street = _street,
            OpenTime = _openTime,
            CloseTime = _closeTime,
            AccountNumber = _accountNumber,
            AccountName = _accountName,
            IsActive = _isActive,
            QrImageId = qr.Id,
            QrImage = qr,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}
