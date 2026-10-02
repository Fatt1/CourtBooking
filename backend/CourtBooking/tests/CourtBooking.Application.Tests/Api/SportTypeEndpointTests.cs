using CourtBooking.API.Extensions;
using CourtBooking.Application.DependencyInjections;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Shouldly;
using Xunit;

namespace CourtBooking.Application.Tests.Api;

public sealed class SportTypeEndpointTests
{
    [Fact]
    public void CreateSportTypeEndpoint_ShouldRequireAdmin()
    {
        var builder = WebApplication.CreateBuilder();
        builder.AddCourtBookingApiVersioning();
        builder.Services.AddApplication();

        using var app = builder.Build();
        app.MapEndpoints();

        var endpoint = ((IEndpointRouteBuilder)app).DataSources
            .SelectMany(source => source.Endpoints)
            .OfType<RouteEndpoint>()
            .SingleOrDefault(route =>
                route.RoutePattern.RawText?.Contains(
                    "admin/sport-types",
                    StringComparison.OrdinalIgnoreCase) == true
                && route.Metadata.GetMetadata<IHttpMethodMetadata>()?
                    .HttpMethods.Contains("POST") == true);

        endpoint.ShouldNotBeNull();

        var hasAdminRole = endpoint!.Metadata
            .GetOrderedMetadata<IAuthorizeData>()
            .Any(auth =>
                auth.Roles is not null &&
                auth.Roles.Split(',').Any(role => role.Trim() == "Admin"));

        hasAdminRole.ShouldBeTrue();
    }

    [Fact]
    public void ListSportTypesEndpoint_ShouldAllowAnonymous()
    {
        var builder = WebApplication.CreateBuilder();
        builder.AddCourtBookingApiVersioning();
        builder.Services.AddApplication();

        using var app = builder.Build();
        app.MapEndpoints();

        var endpoint = ((IEndpointRouteBuilder)app).DataSources
            .SelectMany(source => source.Endpoints)
            .OfType<RouteEndpoint>()
            .SingleOrDefault(route =>
                route.RoutePattern.RawText?.Contains(
                    "/sport-types",
                    StringComparison.OrdinalIgnoreCase) == true
                && route.RoutePattern.RawText?.Contains(
                    "/admin/",
                    StringComparison.OrdinalIgnoreCase) != true
                && route.RoutePattern.RawText?.Contains(
                    "sport-types/{id}",
                    StringComparison.OrdinalIgnoreCase) != true
                && route.Metadata.GetMetadata<IHttpMethodMetadata>()?
                    .HttpMethods.Contains("GET") == true);

        endpoint.ShouldNotBeNull();
        endpoint!.Metadata.GetOrderedMetadata<IAuthorizeData>().ShouldBeEmpty();
    }

    [Fact]
    public void GetSportTypeByIdEndpoint_ShouldAllowAnonymous()
    {
        var builder = WebApplication.CreateBuilder();
        builder.AddCourtBookingApiVersioning();
        builder.Services.AddApplication();

        using var app = builder.Build();
        app.MapEndpoints();

        var endpoint = ((IEndpointRouteBuilder)app).DataSources
            .SelectMany(source => source.Endpoints)
            .OfType<RouteEndpoint>()
            .SingleOrDefault(route =>
                route.RoutePattern.RawText?.Contains(
                    "sport-types/{id}",
                    StringComparison.OrdinalIgnoreCase) == true
                && route.RoutePattern.RawText?.Contains(
                    "/admin/",
                    StringComparison.OrdinalIgnoreCase) != true
                && route.Metadata.GetMetadata<IHttpMethodMetadata>()?
                    .HttpMethods.Contains("GET") == true);

        endpoint.ShouldNotBeNull();
        endpoint!.Metadata.GetMetadata<IAllowAnonymous>().ShouldNotBeNull();
    }

    [Fact]
    public void ListAdminSportTypesEndpoint_ShouldRequireAdmin()
    {
        var builder = WebApplication.CreateBuilder();
        builder.AddCourtBookingApiVersioning();
        builder.Services.AddApplication();

        using var app = builder.Build();
        app.MapEndpoints();

        var endpoint = ((IEndpointRouteBuilder)app).DataSources
            .SelectMany(source => source.Endpoints)
            .OfType<RouteEndpoint>()
            .SingleOrDefault(route =>
                route.RoutePattern.RawText?.Contains(
                    "admin/sport-types",
                    StringComparison.OrdinalIgnoreCase) == true
                && route.Metadata.GetMetadata<IHttpMethodMetadata>()?
                    .HttpMethods.Contains("GET") == true);

        endpoint.ShouldNotBeNull();

        var hasAdminRole = endpoint!.Metadata
            .GetOrderedMetadata<IAuthorizeData>()
            .Any(auth =>
                auth.Roles is not null &&
                auth.Roles.Split(',').Any(role => role.Trim() == "Admin"));

        hasAdminRole.ShouldBeTrue();
    }
}
