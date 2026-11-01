using System.Net;
using System.Net.Http.Json;
using CourtBooking.API.Endpoints.V1.SportTypes;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.SportTypes.Dtos;
using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.Infrastructure.Database;
using IntegrationTests.Common;
using IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace IntegrationTests.Features.SportTypes;

public sealed class SportTypeEndpointsTests : BaseIntegrationTest
{
    public SportTypeEndpointsTests(ApiFixture fixture) : base(fixture)
    {
    }

    [Fact]
    public async Task GetSportTypes_ReturnsOk()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        await GetOrCreateSportTypeTestDataAsync(dbContext);

        // Act - Public endpoint, unauthenticated
        var response = await HttpClient.GetAsync("/api/v1/sport-types");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var sportTypes = await response.Content.ReadFromJsonAsync<IReadOnlyList<SportTypeDto>>();
        Assert.NotNull(sportTypes);
        Assert.NotEmpty(sportTypes);
    }

    [Fact]
    public async Task GetSportTypeById_WhenExists_ReturnsOk()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (sportType, _) = await GetOrCreateSportTypeTestDataAsync(dbContext);

        // Act - Public endpoint
        var response = await HttpClient.GetAsync($"/api/v1/sport-types/{sportType.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<SportTypeDto>();
        Assert.NotNull(dto);
        Assert.Equal(sportType.Id, dto.Id);
    }

    [Fact]
    public async Task GetAdminSportTypes_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Act - Unauthenticated call to admin endpoint
        var response = await HttpClient.GetAsync("/api/v1/admin/sport-types");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAdminSportTypes_WhenAdmin_ReturnsOk()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (sportType, admin) = await GetOrCreateSportTypeTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(admin, [RoleConstants.Admin]);

        // Act
        var response = await client.GetAsync("/api/v1/admin/sport-types");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var list = await response.Content.ReadFromJsonAsync<IReadOnlyList<AdminSportTypeDto>>();
        Assert.NotNull(list);
        Assert.Contains(list, s => s.Id == sportType.Id);
    }

    [Fact]
    public async Task CreateSportType_WhenAdminAndValid_ReturnsCreated()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (_, admin) = await GetOrCreateSportTypeTestDataAsync(dbContext);

        var image = await GetOrCreateTestImageAsync(dbContext);
        using var client = CreateAuthenticatedClient(admin, [RoleConstants.Admin]);

        var uniqueName = $"Môn {Guid.NewGuid():N}";
        var request = new CreateSportTypeRequest(uniqueName, image.Id);

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/admin/sport-types", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var createdId = await response.Content.ReadFromJsonAsync<Guid>();
        Assert.NotEqual(Guid.Empty, createdId);

        using var verifyScope = Fixture.Services.CreateScope();
        var verifyDbContext = verifyScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var saved = await verifyDbContext.SportTypes.FirstOrDefaultAsync(s => s.Id == createdId);
        Assert.NotNull(saved);
        Assert.Equal(uniqueName, saved.Name);
    }

    [Fact]
    public async Task UpdateSportType_WhenAdminAndValid_ReturnsNoContent()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (_, admin) = await GetOrCreateSportTypeTestDataAsync(dbContext);
        var image = await GetOrCreateTestImageAsync(dbContext);

        var tempSport = new SportType
        {
            Id = Guid.NewGuid(),
            Name = $"Môn Cần Sửa {Guid.NewGuid():N}",
            ImageId = image.Id
        };
        dbContext.SportTypes.Add(tempSport);
        await ((DbContext)dbContext).SaveChangesAsync();

        using var client = CreateAuthenticatedClient(admin, [RoleConstants.Admin]);
        var updatedName = $"Môn Đã Sửa {Guid.NewGuid():N}";
        var request = new UpdateSportTypeRequest(updatedName, image.Id);

        // Act
        var response = await client.PutAsJsonAsync($"/api/v1/admin/sport-types/{tempSport.Id}", request);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var verifyScope = Fixture.Services.CreateScope();
        var verifyDbContext = verifyScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var updated = await verifyDbContext.SportTypes.FirstOrDefaultAsync(s => s.Id == tempSport.Id);
        Assert.NotNull(updated);
        Assert.Equal(updatedName, updated.Name);
    }

    [Fact]
    public async Task DeleteSportType_WhenAdminAndUnused_ReturnsNoContent()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (_, admin) = await GetOrCreateSportTypeTestDataAsync(dbContext);
        var image = await GetOrCreateTestImageAsync(dbContext);

        var tempSport = new SportType
        {
            Id = Guid.NewGuid(),
            Name = $"Môn Cần Xóa {Guid.NewGuid():N}",
            ImageId = image.Id
        };
        dbContext.SportTypes.Add(tempSport);
        await ((DbContext)dbContext).SaveChangesAsync();

        using var client = CreateAuthenticatedClient(admin, [RoleConstants.Admin]);

        // Act
        var response = await client.DeleteAsync($"/api/v1/admin/sport-types/{tempSport.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var verifyScope = Fixture.Services.CreateScope();
        var verifyDbContext = verifyScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var deleted = await verifyDbContext.SportTypes.FirstOrDefaultAsync(s => s.Id == tempSport.Id);
        Assert.Null(deleted);
    }

    private static async Task<Image> GetOrCreateTestImageAsync(IApplicationDbContext dbContext)
    {
        var img = await dbContext.Images.FirstOrDefaultAsync();
        if (img == null)
        {
            img = new Image
            {
                Id = Guid.NewGuid(),
                StorageKey = "sport/default.png",
                StorageProvider = StorageProvider.S3,
                Status = ImageStatus.Attached,
                CreatedAt = DateTime.UtcNow,
                AttachedAt = DateTime.UtcNow
            };
            dbContext.Images.Add(img);
            await ((DbContext)dbContext).SaveChangesAsync();
        }
        return img;
    }

    private static async Task<ApplicationUser> GetAdminUserAsync(IApplicationDbContext dbContext)
    {
        var admin = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == DatabaseSeeder.AdminUserId);
        if (admin == null)
        {
            admin = new ApplicationUser
            {
                Id = DatabaseSeeder.AdminUserId,
                FullName = "Admin Test",
                Email = "admin@courtbooking.com",
                UserName = "admin@courtbooking.com",
                PhoneNumber = "0900000001",
                AccountType = AccountType.Admin,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(admin);
            await ((DbContext)dbContext).SaveChangesAsync();
        }
        return admin;
    }

    private static async Task<(SportType SportType, ApplicationUser Admin)> GetOrCreateSportTypeTestDataAsync(IApplicationDbContext dbContext)
    {
        var admin = await GetAdminUserAsync(dbContext);
        var image = await GetOrCreateTestImageAsync(dbContext);

        var sportType = await dbContext.SportTypes.FirstOrDefaultAsync();
        if (sportType == null)
        {
            sportType = new SportType
            {
                Id = Guid.NewGuid(),
                Name = "Cầu lông",
                ImageId = image.Id,
                Image = image
            };
            dbContext.SportTypes.Add(sportType);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        return (sportType, admin);
    }
}
