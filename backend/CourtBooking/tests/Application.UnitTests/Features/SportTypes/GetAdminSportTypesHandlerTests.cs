using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Features.V1.SportTypes.Queries.GetAdminSportTypes;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.SportTypes;

public sealed class GetAdminSportTypesHandlerTests : BaseHandlerTest
{
    [Fact]
    public async Task Handle_ReturnsAdminSportTypesList()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var img = new Image
        {
            Id = Guid.NewGuid(),
            StorageKey = "sport/basketball.png",
            StorageProvider = StorageProvider.S3,
            Status = ImageStatus.Attached,
            CreatedAt = DateTime.UtcNow,
            AttachedAt = DateTime.UtcNow
        };
        await context.Images.AddAsync(img);

        var sport = new SportType
        {
            Id = Guid.NewGuid(),
            Name = "Bóng rổ",
            ImageId = img.Id,
            Image = img
        };
        await context.SportTypes.AddAsync(sport);
        await context.SaveChangesAsync();

        var handler = new GetAdminSportTypesHandler(context);
        var query = new GetAdminSportTypesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        var item = Assert.Single(result.Value);
        Assert.Equal(sport.Id, item.Id);
        Assert.Equal("Bóng rổ", item.Name);
        Assert.Equal(img.Id, item.ImageId);
        Assert.Equal(0, item.BranchCount);
        Assert.NotNull(item.Image);
    }
}
