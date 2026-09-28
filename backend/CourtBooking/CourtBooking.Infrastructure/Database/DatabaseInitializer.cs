using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Infrastructure.Database;

public static class DatabaseInitializer
{
    public static async Task ApplyMigrationsAndSeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var services = scope.ServiceProvider;
        var context = services.GetRequiredService<ApplicationDbContext>();
        var logger = services.GetRequiredService<ILogger<ApplicationDbContext>>();

        try
        {
            logger.LogInformation("Checking and applying pending database migrations...");
            await context.Database.MigrateAsync();
            logger.LogInformation("Database migrations applied successfully.");

            var seederLogger = services.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(DatabaseSeeder));
            await DatabaseSeeder.SeedAsync(context, seederLogger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while migrating or seeding the database.");
            throw new InvalidOperationException("Database migration or seeding failed.", ex);
        }
    }
}
