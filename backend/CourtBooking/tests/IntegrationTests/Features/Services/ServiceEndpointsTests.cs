using System.Net;
using System.Net.Http.Json;
using CourtBooking.API.Endpoints.V1.Services;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.Infrastructure.Database;
using IntegrationTests.Common;
using IntegrationTests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace IntegrationTests.Features.Services;

public sealed class ServiceEndpointsTests : BaseIntegrationTest
{
    public ServiceEndpointsTests(ApiFixture fixture) : base(fixture)
    {
    }

    [Fact]
    public async Task CreateService_WhenValidRequest_ReturnsCreatedAndPersistsService()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, category, owner) = await GetOrCreateServiceTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);
        var serviceName = $"Nước tăng lực {Guid.NewGuid():N}";
        var request = new CreateServiceRequest(
            CategoryId: category.Id,
            Name: serviceName,
            Unit: "Lon",
            ImageId: null,
            Branches: [new ServiceBranchItemDto(branch.Id, 18_000m, true)]);

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/owner/services", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var createdId = await response.Content.ReadFromJsonAsync<Guid>();
        Assert.NotEqual(Guid.Empty, createdId);

        // Verify in database
        var persisted = await dbContext.Services
            .Include(s => s.Branches)
            .FirstOrDefaultAsync(s => s.Id == createdId);
        Assert.NotNull(persisted);
        Assert.Equal(serviceName, persisted.Name);
        Assert.NotEmpty(persisted.Branches);
        Assert.Equal(18_000m, persisted.Branches[0].Price);
    }

    [Fact]
    public async Task CreateService_WhenCategoryDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, _, owner) = await GetOrCreateServiceTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);
        var nonExistentCategoryId = Guid.NewGuid();
        var request = new CreateServiceRequest(
            CategoryId: nonExistentCategoryId,
            Name: "Dịch vụ test",
            Unit: "Gói",
            ImageId: null,
            Branches: [new ServiceBranchItemDto(branch.Id, 10_000m, true)]);

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/owner/services", request);

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateServiceBranchStatus_WhenValid_ReturnsNoContent()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, category, owner) = await GetOrCreateServiceTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Create a service first
        var createRequest = new CreateServiceRequest(
            CategoryId: category.Id,
            Name: $"Khăn lạnh {Guid.NewGuid():N}",
            Unit: "Cái",
            ImageId: null,
            Branches: [new ServiceBranchItemDto(branch.Id, 5_000m, true)]);

        var createResponse = await client.PostAsJsonAsync("/api/v1/owner/services", createRequest);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var createdId = await createResponse.Content.ReadFromJsonAsync<Guid>();

        // Act - Deactivate service at branch
        var updateRequest = new UpdateServiceStatusRequest(false);
        var updateResponse = await client.PutAsJsonAsync(
            $"/api/v1/owner/services/{createdId}/branches/{branch.Id}/status", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);

        // Verify status in database
        var sb = await dbContext.ServiceBranches
            .FirstOrDefaultAsync(x => x.ServiceId == createdId && x.BranchId == branch.Id);
        Assert.NotNull(sb);
        Assert.False(sb.IsActive);
    }

    [Fact]
    public async Task GetPublicServices_WhenBranchExists_ReturnsOk()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, _, _) = await GetOrCreateServiceTestDataAsync(dbContext);

        // Act - Public endpoint, unauthenticated
        var response = await HttpClient.GetAsync($"/api/v1/services/{branch.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var categories = await response.Content.ReadFromJsonAsync<List<BranchCategoryServicesDto>>();
        Assert.NotNull(categories);
    }

    [Fact]
    public async Task GetOwnerServices_WhenOwner_ReturnsOkWithPagedList()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, _, owner) = await GetOrCreateServiceTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Act
        var response = await client.GetAsync($"/api/v1/owner/services?branchId={branch.Id}&page=1&pageSize=10");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PagedList<ServiceDto>>();
        Assert.NotNull(result);
    }

    private static async Task<(Branch Branch, ServiceCategory Category, ApplicationUser Owner)> GetOrCreateServiceTestDataAsync(
        IApplicationDbContext dbContext)
    {
        var owner = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == DatabaseSeeder.CourtOwnerUserId);
        if (owner == null)
        {
            owner = new ApplicationUser
            {
                Id = DatabaseSeeder.CourtOwnerUserId,
                FullName = "Court Owner Test",
                Email = "courtowner-service@courtbooking.com",
                UserName = "courtowner-service@courtbooking.com",
                PhoneNumber = "0900000088",
                AccountType = AccountType.CourtOwner,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(owner);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        var branch = await dbContext.Branches.FirstOrDefaultAsync(b => b.CourtOwnerId == owner.Id && b.IsActive);
        if (branch == null)
        {
            branch = new Branch
            {
                Id = Guid.NewGuid(),
                CourtOwnerId = owner.Id,
                Name = "Chi nhánh Service Integration Test",
                Hotline = "0901234888",
                Province = "Hồ Chí Minh",
                District = "Bình Thạnh",
                Street = "200 Điện Biên Phủ",
                OpenTime = new TimeOnly(6, 0),
                CloseTime = new TimeOnly(23, 0),
                AccountNumber = "888777666",
                AccountName = "NGUYEN VAN TEST",
                IsActive = true
            };
            dbContext.Branches.Add(branch);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        var category = await dbContext.ServiceCategories
            .FirstOrDefaultAsync(c => c.CourtOwnerId == owner.Id && c.IsActive);
        if (category == null)
        {
            category = new ServiceCategory
            {
                Id = Guid.NewGuid(),
                CourtOwnerId = owner.Id,
                Name = $"Danh mục Dịch vụ {Guid.NewGuid():N}",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.ServiceCategories.Add(category);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        return (branch, category, owner);
    }
}
