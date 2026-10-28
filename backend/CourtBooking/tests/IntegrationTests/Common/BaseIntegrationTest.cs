using System.Net.Http.Headers;
using IntegrationTests.Fixtures;
using Microsoft.Extensions.DependencyInjection;

namespace IntegrationTests.Common;

[Collection(nameof(IntegrationTestCollection))]
public abstract class BaseIntegrationTest
{
    protected BaseIntegrationTest(ApiFixture fixture)
    {
        Fixture = fixture;
        HttpClient = fixture.CreateClient();
    }

    protected ApiFixture Fixture { get; }
    protected HttpClient HttpClient { get; }

    protected sealed record AccessTokens(string AccessToken, string RefreshToken);

    protected static string UniqueEmail() => $"test-{Guid.NewGuid():N}@example.com";

    protected void Authenticate(string accessToken)
    {
        HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
    }

    protected HttpClient CreateAuthenticatedClient(CourtBooking.Domain.Entities.Users.ApplicationUser user, IEnumerable<string> roles)
    {
        var client = Fixture.CreateClient();
        var tokenService = Fixture.Services.GetRequiredService<CourtBooking.Application.Abstractions.Authentication.IJwtTokenService>();
        var token = tokenService.GenerateAccessToken(user, roles);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
