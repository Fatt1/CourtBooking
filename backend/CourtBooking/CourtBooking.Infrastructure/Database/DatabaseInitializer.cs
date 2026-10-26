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
            if (context.Database.IsRelational())
            {
                await context.Database.MigrateAsync();
            }
            else
            {
                await context.Database.EnsureCreatedAsync();
            }
            logger.LogInformation("Database migrations applied successfully.");

            var seederLogger = services.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(DatabaseSeeder));
            await DatabaseSeeder.SeedAsync(context, seederLogger);
            await SyncAllBranchPricesAsync(context, seederLogger);
            await SyncAllBranchReviewAveragesAsync(context, seederLogger);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while migrating or seeding the database.");
            throw new InvalidOperationException("Database migration or seeding failed.", ex);
        }
    }

    private static async Task SyncAllBranchPricesAsync(ApplicationDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        var branches = await context.Branches.ToListAsync(cancellationToken);
        if (branches.Count == 0) return;

        var priceTables = await context.PriceTables
            .Where(pt => pt.IsActive)
            .Select(pt => new
            {
                BranchId = pt.CourtType.BranchId,
                pt.DefaultPrice,
                pt.DefaultWalkInPrice,
                Rules = pt.Rules.Select(r => new { r.FixedCustomerPrice, r.WalkInCustomerPrice }).ToList()
            })
            .ToListAsync(cancellationToken);

        var priceByBranch = priceTables.GroupBy(x => x.BranchId).ToDictionary(
            g => g.Key,
            g =>
            {
                var prices = new List<decimal>();
                foreach (var pt in g)
                {
                    if (pt.DefaultPrice > 0) prices.Add(pt.DefaultPrice);
                    if (pt.DefaultWalkInPrice > 0) prices.Add(pt.DefaultWalkInPrice);
                    foreach (var r in pt.Rules)
                    {
                        if (r.FixedCustomerPrice > 0) prices.Add(r.FixedCustomerPrice);
                        if (r.WalkInCustomerPrice > 0) prices.Add(r.WalkInCustomerPrice);
                    }
                }
                return prices.Count > 0 ? (Min: prices.Min(), Max: prices.Max()) : (Min: 0m, Max: 0m);
            });

        bool hasChanges = false;
        foreach (var branch in branches)
        {
            if (priceByBranch.TryGetValue(branch.Id, out var range) && range.Min > 0)
            {
                if (branch.MinPrice != range.Min || branch.MaxPrice != range.Max)
                {
                    branch.MinPrice = range.Min;
                    branch.MaxPrice = range.Max;
                    hasChanges = true;
                    logger.LogInformation("Đã đồng bộ giá cho chi nhánh {BranchName}: {Min} - {Max}", branch.Name, range.Min, range.Max);
                }
            }
        }

        if (hasChanges)
        {
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    private static async Task SyncAllBranchReviewAveragesAsync(ApplicationDbContext context, ILogger logger, CancellationToken cancellationToken = default)
    {
        var branches = await context.Branches.ToListAsync(cancellationToken);
        if (branches.Count == 0) return;

        var reviewStats = await context.Reviews
            .GroupBy(r => r.BranchId)
            .Select(g => new
            {
                BranchId = g.Key,
                Count = g.Count(),
                Average = Math.Round(g.Average(r => (double)r.Rating), 1)
            })
            .ToDictionaryAsync(x => x.BranchId, cancellationToken);

        bool hasChanges = false;
        foreach (var branch in branches)
        {
            if (reviewStats.TryGetValue(branch.Id, out var stats) && stats.Count > 0)
            {
                if (Math.Abs(branch.ReviewAverage - stats.Average) > 0.01)
                {
                    branch.ReviewAverage = stats.Average;
                    hasChanges = true;
                    logger.LogInformation("Đã đồng bộ điểm đánh giá cho chi nhánh {BranchName}: {Average} ({Count} lượt)", branch.Name, stats.Average, stats.Count);
                }
            }
        }

        if (hasChanges)
        {
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
