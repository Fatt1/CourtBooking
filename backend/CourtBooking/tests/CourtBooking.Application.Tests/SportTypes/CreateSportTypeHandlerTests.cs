using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Enums;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using CourtBooking.Application.Features.V1.SportTypes.Commands.CreateSportType;
using CourtBooking.Infrastructure.Database;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Shouldly;
using Xunit;

namespace CourtBooking.Application.Tests.SportTypes;

public sealed class CreateSportTypeHandlerTests
{
    [Fact]
    public async Task Handle_WhenRequestIsValid_ShouldCreateSportType()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"sport-type-{Guid.CreateVersion7()}")
            .Options;

        await using var dbContext = new ApplicationDbContext(options);

        var publisher = Substitute.For<IPublisher>();

        var handler = new CreateSportTypeHandler(
            dbContext,
            publisher);

        var command = new CreateSportTypeCommand(
            Name: "Cầu lông",
            ImageId: null);

        // Act
        var result = await handler.Handle(
            command,
            CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldNotBe(Guid.Empty);

        var sportType = await dbContext.SportTypes.SingleAsync();

        sportType.Id.ShouldBe(result.Value);
        sportType.Id.Version.ShouldBe(7);
        sportType.Name.ShouldBe("Cầu lông");
        sportType.ImageId.ShouldBeNull();
        sportType.IsActive.ShouldBeTrue();
    }
    [Fact]
public async Task Handle_WhenNameAlreadyExistsIgnoringCase_ShouldReturnConflictError()
{
    // Arrange
    var options = new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseInMemoryDatabase($"sport-type-{Guid.CreateVersion7()}")
        .Options;

    await using var dbContext = new ApplicationDbContext(options);

    await dbContext.SportTypes.AddAsync(new SportType
    {
        Id = Guid.CreateVersion7(),
        Name = "Badminton",
        IsActive = true
    });

    await dbContext.SaveChangesAsync();

    var publisher = Substitute.For<IPublisher>();

    var handler = new CreateSportTypeHandler(
        dbContext,
        publisher);

    var command = new CreateSportTypeCommand(
        Name: "BADMINTON",
        ImageId: null);

    // Act
    var result = await handler.Handle(
        command,
        CancellationToken.None);

    // Assert
    result.IsFailure.ShouldBeTrue();
    result.Error.ShouldBeOfType<ConflictError>();
}
[Fact]
    public async Task Handle_WhenImageDoesNotExist_ShouldReturnNotFoundError()
{
    // Arrange
    var options = new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseInMemoryDatabase($"sport-type-{Guid.CreateVersion7()}")
        .Options;

    await using var dbContext = new ApplicationDbContext(options);

    var publisher = Substitute.For<IPublisher>();

    var handler = new CreateSportTypeHandler(
        dbContext,
        publisher);

    var unknownImageId = Guid.CreateVersion7();

    var command = new CreateSportTypeCommand(
        Name: "Pickleball",
        ImageId: unknownImageId);

    // Act
    var result = await handler.Handle(
        command,
        CancellationToken.None);

    // Assert
    result.IsFailure.ShouldBeTrue();
    result.Error.ShouldBeOfType<NotFoundError>();

    (await dbContext.SportTypes.AnyAsync()).ShouldBeFalse();
}
[Fact]
public async Task Handle_WhenImageExists_ShouldPublishAttachImagesEvent()
{
    // Arrange
    var options = new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseInMemoryDatabase($"sport-type-{Guid.CreateVersion7()}")
        .Options;

    await using var dbContext = new ApplicationDbContext(options);

    var imageId = Guid.CreateVersion7();

    await dbContext.Images.AddAsync(new Image
    {
        Id = imageId,
        StorageProvider = StorageProvider.Cloudinary,
        StorageKey = "sport-types/pickleball.png",
        Status = ImageStatus.Pending,
        CreatedAt = DateTime.UtcNow
    });

    await dbContext.SaveChangesAsync();

    var publisher = Substitute.For<IPublisher>();

    var handler = new CreateSportTypeHandler(
        dbContext,
        publisher);

    var command = new CreateSportTypeCommand(
        Name: "Pickleball",
        ImageId: imageId);

    // Act
    var result = await handler.Handle(
        command,
        CancellationToken.None);

    // Assert
    result.IsSuccess.ShouldBeTrue();

    await publisher.Received(1).Publish(
        Arg.Is<AttachImagesEvent>(notification =>
            notification.ImageIds.Count == 1 &&
            notification.ImageIds[0] == imageId),
        Arg.Any<CancellationToken>());
}

}