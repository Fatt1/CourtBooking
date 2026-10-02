using CourtBooking.Application.Features.V1.SportTypes.Queries.GetSportTypes;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace CourtBooking.Application.Tests.SportTypes;

public sealed class GetSportTypesHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnOnlyActiveSportTypes()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"get-sport-types-{Guid.CreateVersion7()}")
            .Options;

        await using var dbContext = new ApplicationDbContext(options);

        var activeId = Guid.CreateVersion7();

        dbContext.SportTypes.AddRange(
            new SportType
            {
                Id = activeId,
                Name = "Cầu lông",
                IsActive = true
            },
            new SportType
            {
                Id = Guid.CreateVersion7(),
                Name = "Môn đã tắt",
                IsActive = false
            });

        await dbContext.SaveChangesAsync();

        var handler = new GetSportTypesHandler(dbContext);

        var result = await handler.Handle(
            new GetSportTypesQuery(),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Count.ShouldBe(1);
        result.Value.Single().Id.ShouldBe(activeId);
        result.Value.Single().Name.ShouldBe("Cầu lông");
    }
}