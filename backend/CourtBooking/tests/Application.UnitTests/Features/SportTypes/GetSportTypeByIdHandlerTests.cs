using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Features.V1.SportTypes.Queries.GetSportTypeById;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.SportTypes;

public sealed class GetSportTypeByIdHandlerTests : BaseHandlerTest
{
    [Fact]
    public async Task Handle_WhenNotFound_ReturnsNotFoundError()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new GetSportTypeByIdHandler(context);
        var query = new GetSportTypeByIdQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenExists_ReturnsSportTypeDto()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var img = new Image
        {
            Id = Guid.NewGuid(),
            StorageKey = "sport/football.png",
            StorageProvider = StorageProvider.S3,
            Status = ImageStatus.Attached,
            CreatedAt = DateTime.UtcNow,
            AttachedAt = DateTime.UtcNow
        };
        await context.Images.AddAsync(img);

        var sport = new SportType
        {
            Id = Guid.NewGuid(),
            Name = "Bóng đá",
            ImageId = img.Id,
            Image = img
        };
        await context.SportTypes.AddAsync(sport);
        await context.SaveChangesAsync();

        var handler = new GetSportTypeByIdHandler(context);
        var query = new GetSportTypeByIdQuery(sport.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal(sport.Id, result.Value.Id);
        Assert.Equal("Bóng đá", result.Value.Name);
        Assert.Equal(0, result.Value.BranchCount);
        Assert.NotNull(result.Value.Image);
        Assert.Equal("sport/football.png", result.Value.Image.Key);
    }
}
