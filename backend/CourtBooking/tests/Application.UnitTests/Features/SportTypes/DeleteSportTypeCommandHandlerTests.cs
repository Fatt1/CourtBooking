using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Features.V1.SportTypes.Commands.DeleteSportType;
using CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.SportTypes;

public sealed class DeleteSportTypeCommandHandlerTests : BaseHandlerTest
{
    private readonly IPublisher _publisher = Substitute.For<IPublisher>();

    [Fact]
    public async Task Handle_WhenSportTypeNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new DeleteSportTypeHandler(context, _publisher);
        var command = new DeleteSportTypeCommand(Guid.NewGuid());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenUsedByAnyBranch_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var sport = new SportType { Id = Guid.NewGuid(), Name = "Cầu lông" };
        await context.SportTypes.AddAsync(sport);

        var branchSport = new BranchSportType { BranchId = Guid.NewGuid(), SportTypeId = sport.Id };
        await context.BranchSportTypes.AddAsync(branchSport);
        await context.SaveChangesAsync();

        var handler = new DeleteSportTypeHandler(context, _publisher);
        var command = new DeleteSportTypeCommand(sport.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenUnused_DeletesSportTypeAndPublishesDeleteImagesEvent()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var imageId = Guid.NewGuid();
        var sport = new SportType { Id = Guid.NewGuid(), Name = "Golf", ImageId = imageId };
        await context.SportTypes.AddAsync(sport);
        await context.SaveChangesAsync();

        var handler = new DeleteSportTypeHandler(context, _publisher);
        var command = new DeleteSportTypeCommand(sport.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        var deleted = await context.SportTypes.FirstOrDefaultAsync(st => st.Id == sport.Id);
        Assert.Null(deleted);

        await _publisher.Received(1).Publish(
            Arg.Is<DeleteImagesEvent>(e => e.ImageIds.Contains(imageId)),
            Arg.Any<CancellationToken>());
    }
}
