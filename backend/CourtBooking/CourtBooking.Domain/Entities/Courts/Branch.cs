using CourtBooking.Domain.Abstractions;

namespace CourtBooking.Domain.Entities.Courts;

/// <summary>
/// Chi nhánh sân (Branch)
/// </summary>
public class Branch : EntityBase<Guid>, IAuditable
{
    public Branch() { }

    public Guid CourtOwnerId { get; set; }
    public string Name { get; set; } = null!;
    public string Hotline { get; set; } = null!;
    public string GgMapUrl { get; set; } = null!;
    public string Province { get; set; } = null!;
    public string District { get; set; } = null!;
    public string Street { get; set; } = null!;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsActive { get; set; }
    public double ReviewAverage { get; set; }
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public TimeOnly OpenTime { get; set; }
    public TimeOnly CloseTime { get; set; }
    public string? Policy { get; set; }
    public Guid QrImageId { get; set; }
    public string AccountNumber { get; set; } = null!;
    public string AccountName { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public Users.CourtOwner CourtOwner { get; set; } = null!;
    public List<BranchSportType> BranchSportTypes { get; set; } = [];
    public Images.Image QrImage { get; set; } = null!;

    public List<CourtType> CourtTypes { get; set; } = [];
    public List<Services.ServiceBranch> ServiceBranches { get; set; } = [];
    public List<Reviews.Review> Reviews { get; set; } = [];
    public List<Orders.Order> Orders { get; set; } = [];
    public List<Matches.SocialMatch> SocialMatches { get; set; } = [];
    public List<Services.RetailOrder> RetailOrders { get; set; } = [];
    public List<BranchImage> Images { get; set; } = [];


    public (IReadOnlyList<Guid> AddedImages, IReadOnlyList<Guid> RemovedImages) UpdateImages(IEnumerable<Guid>? newImageIds)
    {
        var targetIds = (newImageIds ?? []).Distinct().ToList();
        var currentIds = Images.Select(x => x.ImageId).ToHashSet();
        // 1. Phân loại ảnh thêm mới và ảnh bị gỡ
        var added = targetIds.Where(id => !currentIds.Contains(id)).ToList();
        var removed = currentIds.Where(id => !targetIds.Contains(id)).ToList();
        // 2. Xóa các ảnh cũ
        Images.RemoveAll(x => removed.Contains(x.ImageId));
        // 3. Thêm các ảnh mới và cập nhật thứ tự
        for (int i = 0; i < targetIds.Count; i++)
        {
            var imageId = targetIds[i];
            if (added.Contains(imageId))
            {
                Images.Add(new BranchImage
                {
                    Id = Guid.CreateVersion7(),
                    BranchId = Id,
                    ImageId = imageId,
                    DisplayOrder = i
                });

            }
            else
            {
                var existing = Images.FirstOrDefault(x => x.ImageId == imageId)!;
                existing.DisplayOrder = i;
            }
            // 4. Trả về Tuple trực tiếp:

        }
        return (added, removed);
    }
}
