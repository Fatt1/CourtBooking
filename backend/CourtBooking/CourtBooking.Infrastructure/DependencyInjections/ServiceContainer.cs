using Amazon.S3;
using CourtBooking.Application.Abstractions.Storage;
using CourtBooking.Infrastructure.Database;
using CourtBooking.Infrastructure.Interceptors;
using CourtBooking.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace CourtBooking.Infrastructure.DependencyInjections;

public static class ServiceContainer
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        // ── Options — validated at startup ───────────────────────────
        services.AddOptions<DatabaseOptions>()
            .BindConfiguration(DatabaseOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        // ── EF Core — SQL Server ─────────────────────────────────────
        services.AddSingleton<AuditInterceptor>();

        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {

            var db = sp.GetRequiredService<IOptions<DatabaseOptions>>().Value;

            options.UseSqlServer(db.DefaultConnection, sqlOptions =>
            {
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: db.MaxRetryCount,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorNumbersToAdd: null);

                sqlOptions.CommandTimeout(db.CommandTimeoutSeconds);

                // Migrations are generated and stored in the Infrastructure assembly
                sqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.GetName().Name);
            });

            options.AddInterceptors(sp.GetRequiredService<AuditInterceptor>());
        });

        // ── Object Storage — SeaweedFS / S3 ─────────────────────────
        services.AddOptions<StorageOptions>()
            .BindConfiguration(StorageOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddSingleton<IAmazonS3>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<StorageOptions>>().Value;
            var config = new AmazonS3Config
            {
                ServiceURL = options.ServiceUrl,
                ForcePathStyle = options.ForcePathStyle,
                UseHttp = true,
            };

            return new AmazonS3Client(options.AccessKey, options.SecretKey, config);
        });


        services.AddScoped<IStorageService, S3StorageService>();

        return services;
    }
}

