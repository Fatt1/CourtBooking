using CourtBooking.API.Extensions;
using CourtBooking.API.Infrastructure;
using CourtBooking.Application.DependencyInjections;
using CourtBooking.Infrastructure.DependencyInjections;
using Scalar.AspNetCore;
using Serilog;


Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting CourtBooking API");

    // Load .env file in Development so local secrets stay out of appsettings.
    // In production, real environment variables are injected by Docker/orchestrator.
    if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
    {
        // Walk up from the project dir to find .env at the solution root.
        DotNetEnv.Env.TraversePath().Load();
    }

    var builder = WebApplication.CreateBuilder(args);

    builder.Services.AddSerilog((services, lc) => lc
        .ReadFrom.Configuration(builder.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("MachineName", Environment.MachineName)
        .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
        .Enrich.WithProperty("Application", "CourtBooking.API"));

    // API versioning — URL-segment style: /api/v{N}/...
    // AddMvc() enables versioning on MVC Controllers in addition to Minimal APIs.
    builder.AddCourtBookingApiVersioning();
    builder.Services.AddControllers();

    // Application layer: MediatR + ValidationBehavior + FluentValidation validators
    builder.Services.AddApplication();

    // Infrastructure layer: EF Core (SQL Server), interceptors
    builder.Services.AddInfrastructureServices();

    // OpenAPI document at /openapi/v1.json
    builder.Services.AddOpenApi("v1");

    // Register the global exception handler (IExceptionHandler implementation).
    builder.Services.AddExceptionHandler<GlobalExceptionHandlerMiddleware>();

    // Required companion for UseExceptionHandler() when using IExceptionHandler.
    builder.Services.AddProblemDetails();

    var app = builder.Build();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        // Expose the raw OpenAPI JSON document at /openapi/v1.json
        app.MapOpenApi();

        // Scalar UI — available at /scalar/v1
        app.MapScalarApiReference(options =>
        {
            options
                .WithTitle("CourtBooking API")
                .WithTheme(ScalarTheme.DeepSpace)          // dark theme
                .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
            // Sidebar is shown by default — no need to call WithSidebar(true)
            // Proxy disabled: requests go directly to your API, not through proxy.scalar.com
        });
    }

    // Must be placed before all other middleware so exceptions from any handler are caught.
    app.UseExceptionHandler();

    // Replace the noisy per-request ASP.NET Core log events with a single summary event.
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate =
            "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";

        // Elevate to Error for 5xx responses and exceptions.
        options.GetLevel = (httpContext, _, ex) =>
            ex is not null || httpContext.Response.StatusCode >= 500
                ? Serilog.Events.LogEventLevel.Error
                : Serilog.Events.LogEventLevel.Information;
    });

    app.UseHttpsRedirection();

    app.UseAuthorization();

    app.MapControllers();

    app.MapEndpoints();
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    // Flush async sinks (Seq, file) before the process exits.
    await Log.CloseAndFlushAsync();
}
