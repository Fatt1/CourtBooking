using System.Net;
using System.Net.Http.Json;
using CourtBooking.API.Endpoints.V1.ServiceCategories;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.ServiceCategories.Dtos;
using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.Infrastructure.Database;
using IntegrationTests.Common;
using IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace IntegrationTests.Features.ServiceCategories;

public sealed class ServiceCategoryEndpointsTests : BaseIntegrationTest
{
    public ServiceCategoryEndpointsTests(ApiFixture fixture) : base(fixture)
    {
    }

    [Fact]
    public async Task CreateServiceCategory_WhenValid_ReturnsCreated_AndWhenDuplicate_ReturnsConflict()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var owner = await GetCourtOwnerAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);
        var categoryName = $"Đồ uống VIP {Guid.NewGuid():N}";
        var request = new CreateServiceCategoryRequest(categoryName, "Mô tả danh mục", true);

        // Act 1: Tạo mới thành công -> 201 Created
        var createResponse = await client.PostAsJsonAsync("/api/v1/owner/service-categories", request);

        // Assert 1
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var createdId = await createResponse.Content.ReadFromJsonAsync<Guid>();
        Assert.NotEqual(Guid.Empty, createdId);

        // Act 2: Trùng tên cùng chủ sân -> 409 Conflict
        var duplicateResponse = await client.PostAsJsonAsync("/api/v1/owner/service-categories", request);

        // Assert 2
        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);
    }

    [Fact]
    public async Task GetServiceCategories_WhenOwner_ReturnsOkWithList()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var owner = await GetCourtOwnerAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Act
        var response = await client.GetAsync("/api/v1/owner/service-categories");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var list = await response.Content.ReadFromJsonAsync<IReadOnlyList<ServiceCategoryDto>>();
        Assert.NotNull(list);
    }

    [Fact]
    public async Task GetServiceCategoryById_WhenExists_ReturnsOk_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var owner = await GetCourtOwnerAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        var createReq = new CreateServiceCategoryRequest($"Phụ kiện {Guid.NewGuid():N}", "Mô tả", true);
        var createRes = await client.PostAsJsonAsync("/api/v1/owner/service-categories", createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var createdId = await createRes.Content.ReadFromJsonAsync<Guid>();

        // Act 1: Existing id -> 200 OK
        var getRes = await client.GetAsync($"/api/v1/owner/service-categories/{createdId}");

        // Assert 1
        Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);
        var category = await getRes.Content.ReadFromJsonAsync<ServiceCategoryDto>();
        Assert.NotNull(category);
        Assert.Equal(createdId, category.Id);

        // Act 2: Non-existent id -> 404 NotFound
        var notFoundRes = await client.GetAsync($"/api/v1/owner/service-categories/{Guid.NewGuid()}");

        // Assert 2
        Assert.Equal(HttpStatusCode.NotFound, notFoundRes.StatusCode);
    }

    [Fact]
    public async Task UpdateServiceCategory_WhenValid_ReturnsNoContent()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var owner = await GetCourtOwnerAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        var originalName = $"Danh mục gốc {Guid.NewGuid():N}";
        var createReq = new CreateServiceCategoryRequest(originalName, "Mô tả gốc", true);
        var createRes = await client.PostAsJsonAsync("/api/v1/owner/service-categories", createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var createdId = await createRes.Content.ReadFromJsonAsync<Guid>();

        var updateReq = new UpdateServiceCategoryRequest($"{originalName} - Đã sửa", "Mô tả mới", false);

        // Act
        var updateRes = await client.PutAsJsonAsync($"/api/v1/owner/service-categories/{createdId}", updateReq);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, updateRes.StatusCode);

        // Verify in database
        var persisted = await dbContext.ServiceCategories.FirstOrDefaultAsync(c => c.Id == createdId);
        Assert.NotNull(persisted);
        Assert.Equal($"{originalName} - Đã sửa", persisted.Name);
        Assert.False(persisted.IsActive);
    }

    [Fact]
    public async Task DeleteServiceCategory_WhenUnused_ReturnsNoContent()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var owner = await GetCourtOwnerAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        var createReq = new CreateServiceCategoryRequest($"Danh mục xóa {Guid.NewGuid():N}", "Sắp bị xóa", true);
        var createRes = await client.PostAsJsonAsync("/api/v1/owner/service-categories", createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var createdId = await createRes.Content.ReadFromJsonAsync<Guid>();

        // Act
        var deleteRes = await client.DeleteAsync($"/api/v1/owner/service-categories/{createdId}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);

        // Verify removed from database
        var persisted = await dbContext.ServiceCategories.FirstOrDefaultAsync(c => c.Id == createdId);
        Assert.Null(persisted);
    }

    [Fact]
    public async Task DeleteServiceCategory_WhenInUse_ReturnsConflict()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var owner = await GetCourtOwnerAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        var category = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = owner.Id,
            Name = $"Danh mục đang dùng {Guid.NewGuid():N}",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var service = new Service
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Name = "Dịch vụ đính kèm",
            Unit = "Lần",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.ServiceCategories.Add(category);
        dbContext.Services.Add(service);
        await ((DbContext)dbContext).SaveChangesAsync();

        // Act
        var response = await client.DeleteAsync($"/api/v1/owner/service-categories/{category.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    private static async Task<ApplicationUser> GetCourtOwnerAsync(IApplicationDbContext dbContext)
    {
        var owner = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == DatabaseSeeder.CourtOwnerUserId);
        if (owner == null)
        {
            owner = new ApplicationUser
            {
                Id = DatabaseSeeder.CourtOwnerUserId,
                FullName = "Court Owner Test",
                Email = "courtowner-category@courtbooking.com",
                UserName = "courtowner-category@courtbooking.com",
                PhoneNumber = "0900000077",
                AccountType = AccountType.CourtOwner,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(owner);
            await ((DbContext)dbContext).SaveChangesAsync();
        }
        return owner;
    }
}
