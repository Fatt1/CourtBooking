using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Features.V1.SportTypes.Commands.UpdateSportType;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.SportTypes;

public sealed class UpdateSportTypeCommandHandlerTests : BaseHandlerTest
{
    private readonly IPublisher _publisher = Substitute.For<IPublisher>();

    [Fact]
    public async Task Handle_WhenSportTypeNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new UpdateSportTypeHandler(context, _publisher);
        var command = new UpdateSportTypeCommand(Guid.NewGuid(), "Bóng bàn", Guid.NewGuid());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenNameAlreadyExistsOnAnotherSportType_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var sport1 = new SportType { Id = Guid.NewGuid(), Name = "Bóng đá" };
        var sport2 = new SportType { Id = Guid.NewGuid(), Name = "Cầu lông" };
        await context.SportTypes.AddRangeAsync(sport1, sport2);
        await context.SaveChangesAsync();

        var handler = new UpdateSportTypeHandler(context, _publisher);
        var command = new UpdateSportTypeCommand(sport2.Id, "  Bóng đá  ", Guid.NewGuid());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValidWithNewImage_UpdatesSportTypeAndPublishesAttachAndDeleteEvents()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var oldImageId = Guid.NewGuid();
        var sport = new SportType { Id = Guid.NewGuid(), Name = "Tennis Cũ", ImageId = oldImageId };
        await context.SportTypes.AddAsync(sport);
        await context.SaveChangesAsync();

        var newImageId = Guid.NewGuid();
        var handler = new UpdateSportTypeHandler(context, _publisher);
        var command = new UpdateSportTypeCommand(sport.Id, "Tennis Mới", newImageId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        var updated = await context.SportTypes.FirstOrDefaultAsync(st => st.Id == sport.Id);
        Assert.NotNull(updated);
        Assert.Equal("Tennis Mới", updated.Name);
        Assert.Equal(newImageId, updated.ImageId);

        await _publisher.Received(1).Publish(
            Arg.Is<AttachImagesEvent>(e => e.ImageIds.Contains(newImageId)),
            Arg.Any<CancellationToken>());

        await _publisher.Received(1).Publish(
            Arg.Is<DeleteImagesEvent>(e => e.ImageIds.Contains(oldImageId)),
            Arg.Any<CancellationToken>());
    }
}
