using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Features.V1.SportTypes.Commands.CreateSportType;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.SportTypes;

public sealed class CreateSportTypeCommandHandlerTests : BaseHandlerTest
{
    private readonly IPublisher _publisher = Substitute.For<IPublisher>();

    [Fact]
    public async Task Handle_WhenNameAlreadyExists_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var existingSport = new SportType { Id = Guid.NewGuid(), Name = "Cầu lông" };
        await context.SportTypes.AddAsync(existingSport);
        await context.SaveChangesAsync();

        var handler = new CreateSportTypeHandler(context, _publisher);
        var command = new CreateSportTypeCommand("  cầu lông  ", Guid.NewGuid());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValid_CreatesSportTypeAndPublishesAttachImagesEvent()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new CreateSportTypeHandler(context, _publisher);
        var imageId = Guid.NewGuid();
        var command = new CreateSportTypeCommand("Bóng rổ", imageId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotEqual(Guid.Empty, result.Value);

        var savedSport = await context.SportTypes.FirstOrDefaultAsync(st => st.Id == result.Value);
        Assert.NotNull(savedSport);
        Assert.Equal("Bóng rổ", savedSport.Name);
        Assert.Equal(imageId, savedSport.ImageId);

        await _publisher.Received(1).Publish(
            Arg.Is<AttachImagesEvent>(e => e.ImageIds.Contains(imageId)),
            Arg.Any<CancellationToken>());
    }
}
