using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Features.V1.SportTypes.Queries.GetSportTypes;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.SportTypes;

public sealed class GetSportTypesHandlerTests : BaseHandlerTest
{
    [Fact]
    public async Task Handle_WhenSportTypesExist_ReturnsListWithBranchCount()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var img = new Image
        {
            Id = Guid.NewGuid(),
            StorageKey = "sport/badminton.png",
            StorageProvider = StorageProvider.S3,
            Status = ImageStatus.Attached,
            CreatedAt = DateTime.UtcNow,
            AttachedAt = DateTime.UtcNow
        };
        await context.Images.AddAsync(img);

        var sport = new SportType
        {
            Id = Guid.NewGuid(),
            Name = "Cầu lông",
            ImageId = img.Id,
            Image = img
        };
        await context.SportTypes.AddAsync(sport);

        var branchSport = new BranchSportType { BranchId = Guid.NewGuid(), SportTypeId = sport.Id };
        await context.BranchSportTypes.AddAsync(branchSport);
        await context.SaveChangesAsync();

        var handler = new GetSportTypesHandler(context);
        var query = new GetSportTypesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        var item = Assert.Single(result.Value);
        Assert.Equal("Cầu lông", item.Name);
        Assert.Equal(1, item.BranchCount);
        Assert.NotNull(item.Image);
        Assert.Equal("sport/badminton.png", item.Image.Key);
    }
}
