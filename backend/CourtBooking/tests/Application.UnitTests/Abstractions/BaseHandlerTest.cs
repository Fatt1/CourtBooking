using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Abstractions;

public abstract class BaseHandlerTest
{
    protected static TestDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<TestDbContext>()
            .UseInMemoryDatabase($"court-booking-{Guid.NewGuid()}")
            .Options;

        return new TestDbContext(options);
    }
}

