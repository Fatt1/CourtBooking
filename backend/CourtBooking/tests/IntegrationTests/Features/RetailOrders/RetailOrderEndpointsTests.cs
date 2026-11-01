using System.Net;
using System.Net.Http.Json;
using CourtBooking.API.Endpoints.V1.RetailOrders;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.RetailOrders.Dtos;
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

namespace IntegrationTests.Features.RetailOrders;

public sealed class RetailOrderEndpointsTests : BaseIntegrationTest
{
    public RetailOrderEndpointsTests(ApiFixture fixture) : base(fixture)
    {
    }

    [Fact]
    public async Task CreateRetailOrder_WhenValidRequest_ReturnsCreatedAndPersistsOrder()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, service, owner) = await GetOrCreateRetailTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);
        var request = new CreateRetailOrderRequest(
            BranchId: branch.Id,
            DiscountAmount: 5_000m,
            Items: [new CreateRetailOrderItemRequest(service.Id, 2)]);

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/owner/retail-orders", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var order = await response.Content.ReadFromJsonAsync<RetailOrderDto>();
        Assert.NotNull(order);
        Assert.NotEqual(Guid.Empty, order.Id);
        Assert.StartsWith("HD-", order.OrderCode);
        Assert.Equal(branch.Id, order.BranchId);
        Assert.Equal(5_000m, order.DiscountAmount);
        Assert.NotEmpty(order.Items);
        Assert.Equal(2, order.Items[0].Quantity);

        // Verify in database
        var persisted = await dbContext.RetailOrders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == order.Id);
        Assert.NotNull(persisted);
        Assert.Equal(order.TotalAmount, persisted.TotalAmount);
    }

    [Fact]
    public async Task CreateRetailOrder_WhenItemsListIsEmpty_ReturnsBadRequest()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, _, owner) = await GetOrCreateRetailTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);
        var request = new CreateRetailOrderRequest(
            BranchId: branch.Id,
            DiscountAmount: 0m,
            Items: []);

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/owner/retail-orders", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateRetailOrder_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Arrange
        var request = new CreateRetailOrderRequest(
            BranchId: Guid.NewGuid(),
            DiscountAmount: 0m,
            Items: [new CreateRetailOrderItemRequest(Guid.NewGuid(), 1)]);

        // Act - unauthenticated default client
        var response = await HttpClient.PostAsJsonAsync("/api/v1/owner/retail-orders", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetRetailOrders_WhenFilteredByBranch_ReturnsOkWithPagedList()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, _, owner) = await GetOrCreateRetailTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Act
        var response = await client.GetAsync($"/api/v1/owner/retail-orders?branchId={branch.Id}&page=1&pageSize=10");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var pagedResult = await response.Content.ReadFromJsonAsync<PagedList<RetailOrderListItemDto>>();
        Assert.NotNull(pagedResult);
    }

    [Fact]
    public async Task GetRetailOrderSummary_WhenOwner_ReturnsOkWithSummaryDto()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, _, owner) = await GetOrCreateRetailTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Act
        var response = await client.GetAsync($"/api/v1/owner/retail-orders/summary?branchId={branch.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var summary = await response.Content.ReadFromJsonAsync<RetailOrderSummaryDto>();
        Assert.NotNull(summary);
    }

    [Fact]
    public async Task GetRetailOrderById_WhenExists_ReturnsOk()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, service, owner) = await GetOrCreateRetailTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Create an order first
        var createRequest = new CreateRetailOrderRequest(
            BranchId: branch.Id,
            DiscountAmount: 0m,
            Items: [new CreateRetailOrderItemRequest(service.Id, 1)]);

        var createResponse = await client.PostAsJsonAsync("/api/v1/owner/retail-orders", createRequest);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var createdOrder = await createResponse.Content.ReadFromJsonAsync<RetailOrderDto>();
        Assert.NotNull(createdOrder);

        // Act
        var response = await client.GetAsync($"/api/v1/owner/retail-orders/{createdOrder.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var fetchedOrder = await response.Content.ReadFromJsonAsync<RetailOrderDto>();
        Assert.NotNull(fetchedOrder);
        Assert.Equal(createdOrder.Id, fetchedOrder.Id);
    }

    [Fact]
    public async Task GetRetailOrderById_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (_, _, owner) = await GetOrCreateRetailTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await client.GetAsync($"/api/v1/owner/retail-orders/{nonExistentId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static async Task<(Branch Branch, Service Service, ApplicationUser Owner)> GetOrCreateRetailTestDataAsync(
        IApplicationDbContext dbContext)
    {
        var owner = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == DatabaseSeeder.CourtOwnerUserId);
        if (owner == null)
        {
            owner = new ApplicationUser
            {
                Id = DatabaseSeeder.CourtOwnerUserId,
                FullName = "Court Owner Test",
                Email = "courtowner-retail@courtbooking.com",
                UserName = "courtowner-retail@courtbooking.com",
                PhoneNumber = "0900000099",
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
                Name = "Chi nhánh Retail Integration Test",
                Hotline = "0901234999",
                Province = "Hồ Chí Minh",
                District = "Quận 1",
                Street = "100 Nguyễn Huệ",
                OpenTime = new TimeOnly(6, 0),
                CloseTime = new TimeOnly(23, 0),
                AccountNumber = "999888777",
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
                Name = $"Danh mục Retail {Guid.NewGuid():N}",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.ServiceCategories.Add(category);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        var service = await dbContext.Services
            .Include(s => s.Branches)
            .FirstOrDefaultAsync(s => s.CategoryId == category.Id);
        if (service == null)
        {
            service = new Service
            {
                Id = Guid.NewGuid(),
                CategoryId = category.Id,
                Name = "Nước tăng lực integration test",
                Unit = "Lon",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Services.Add(service);

            var sb = new ServiceBranch
            {
                ServiceId = service.Id,
                BranchId = branch.Id,
                Price = 20_000m,
                IsActive = true
            };
            dbContext.ServiceBranches.Add(sb);
            await ((DbContext)dbContext).SaveChangesAsync();
        }
        else
        {
            var branchLink = service.Branches.FirstOrDefault(b => b.BranchId == branch.Id);
            if (branchLink == null)
            {
                dbContext.ServiceBranches.Add(new ServiceBranch
                {
                    ServiceId = service.Id,
                    BranchId = branch.Id,
                    Price = 20_000m,
                    IsActive = true
                });
                await ((DbContext)dbContext).SaveChangesAsync();
            }
        }

        return (branch, service, owner);
    }
}
