using System.Net.Http.Headers;

namespace IntegrationTests;

[Collection(nameof(IntegrationTestCollection))]
public abstract class BaseIntegrationTest
{
    protected BaseIntegrationTest(IntegrationTestWebAppFactory factory)
    {
        Factory = factory;
        HttpClient = factory.CreateClient();
    }

    protected IntegrationTestWebAppFactory Factory { get; }
    protected HttpClient HttpClient { get; }

    protected sealed record AccessTokens(string AccessToken, string RefreshToken);

    protected static string UniqueEmail() => $"test-{Guid.NewGuid():N}@example.com";

    protected void Authenticate(string accessToken)
    {
        HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
    }

    protected HttpClient CreateAuthenticatedClient(CourtBooking.Domain.Entities.Users.ApplicationUser user, IEnumerable<string> roles)
    {
        var client = Factory.CreateClient();
        var tokenService = Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService<CourtBooking.Application.Abstractions.Authentication.IJwtTokenService>(Factory.Services);
        var token = tokenService.GenerateAccessToken(user, roles);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
