using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace IntegrationTests;

public class IntegrationTestWebAppFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _databaseName = $"CourtBooking-Test-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"InMemory:{_databaseName}",
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

    public Task InitializeAsync() => Task.CompletedTask;

    public new Task DisposeAsync() => Task.CompletedTask;
}
