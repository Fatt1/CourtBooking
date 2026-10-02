using CourtBooking.Application.Features.V1.SportTypes.Commands.UpdateSportTypeStatus;
using CourtBooking.SharedKernel;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace CourtBooking.Application.Tests.SportTypes;

public sealed class UpdateSportTypeStatusHandlerTests
{
    [Fact]
    public async Task Handle_WhenDeactivating_ShouldSaveInactiveStatus()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"sport-type-status-{Guid.CreateVersion7()}")
            .Options;

        await using var dbContext = new ApplicationDbContext(options);
        var id = Guid.CreateVersion7();

        dbContext.SportTypes.Add(new SportType
        {
            Id = id,
            Name = "Cầu lông",
            IsActive = true
        });
        await dbContext.SaveChangesAsync();

        var handler = new UpdateSportTypeStatusHandler(dbContext);
        var result = await handler.Handle(
            new UpdateSportTypeStatusCommand(id, false),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();

        dbContext.ChangeTracker.Clear();
        var savedSportType = await dbContext.SportTypes
            .SingleAsync(item => item.Id == id);
        savedSportType.IsActive.ShouldBeFalse();
    }

    [Fact]
    public async Task Handle_WhenSportTypeDoesNotExist_ShouldReturnNotFound()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"missing-sport-type-{Guid.CreateVersion7()}")
            .Options;

        await using var dbContext = new ApplicationDbContext(options);
        var missingId = Guid.CreateVersion7();

        var handler = new UpdateSportTypeStatusHandler(dbContext);
        var result = await handler.Handle(
            new UpdateSportTypeStatusCommand(missingId, false),
            CancellationToken.None);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<NotFoundError>();
    }
}