using CourtBooking.Application.Features.V1.SportTypes.Queries.GetSportTypeById;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using CourtBooking.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace CourtBooking.Application.Tests.SportTypes;

public sealed class GetSportTypeByIdHandlerTests
{
    [Fact]
    public async Task Handle_WhenSportTypeIsActive_ShouldReturnItsDetails()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"sport-type-by-id-{Guid.CreateVersion7()}")
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

        var handler = new GetSportTypeByIdHandler(dbContext);
        var result = await handler.Handle(
            new GetSportTypeByIdQuery(id),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Id.ShouldBe(id);
        result.Value.Name.ShouldBe("Cầu lông");
    }
    [Fact]
    public async Task Handle_WhenSportTypeIsInactive_ShouldReturnNotFound()
{
    var options = new DbContextOptionsBuilder<ApplicationDbContext>()
        .UseInMemoryDatabase($"sport-type-inactive-{Guid.CreateVersion7()}")
        .Options;

    await using var dbContext = new ApplicationDbContext(options);
    var id = Guid.CreateVersion7();

    dbContext.SportTypes.Add(new SportType
    {
        Id = id,
        Name = "Môn đã tắt",
        IsActive = false
    });
    await dbContext.SaveChangesAsync();

    var handler = new GetSportTypeByIdHandler(dbContext);
    var result = await handler.Handle(
        new GetSportTypeByIdQuery(id),
        CancellationToken.None);

    result.IsFailure.ShouldBeTrue();
    result.Error.ShouldBeOfType<NotFoundError>();
}
}