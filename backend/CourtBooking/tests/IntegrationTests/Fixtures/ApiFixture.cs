using CourtBooking.Infrastructure.Database;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.MsSql;

namespace IntegrationTests.Fixtures;

public class ApiFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MsSqlContainer _mssql = new MsSqlBuilder("mcr.microsoft.com/mssql/server:2022-latest")
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = _mssql.GetConnectionString(),
                ["Storage:ServiceUrl"] = "http://localhost:8333",
                ["Storage:AccessKey"] = "test_key",
                ["Storage:SecretKey"] = "test_secret",
                ["Storage:BucketName"] = "test_bucket",
                ["Jwt:Issuer"] = "CourtBooking",
                ["Jwt:Audience"] = "CourtBookingClient",
                ["Jwt:SecretKey"] = "CourtBooking_Super_Secret_Jwt_Security_Key_2026_Minimum_32_Characters_Long!",
                ["Jwt:AccessTokenExpirationInMinutes"] = "60",
                ["Jwt:RefreshTokenExpirationInDays"] = "30"
            });
        });
    }

    public async Task InitializeAsync()
    {
        await _mssql.StartAsync();

        // Ensure host is started and database migrations and seeder are applied
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync();
        }
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _mssql.DisposeAsync();
        await base.DisposeAsync();
    }
}
