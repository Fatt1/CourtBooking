using System.Net;
using System.Net.Http.Json;
using CourtBooking.API.Endpoints.V1.Branches;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Branches.Dtos;
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

namespace IntegrationTests.Features.Branches;

public sealed class BranchManagementEndpointsTests : BaseIntegrationTest
{
    public BranchManagementEndpointsTests(ApiFixture fixture) : base(fixture)
    {
    }

    [Fact]
    public async Task GetPublicBranches_ReturnsOk()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        await GetOrCreateBranchTestDataAsync(dbContext);

        // Act - Public endpoint, unauthenticated
        var response = await HttpClient.GetAsync("/api/v1/branches");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var pagedList = await response.Content.ReadFromJsonAsync<PagedList<PublicBranchListItemDto>>();
        Assert.NotNull(pagedList);
        Assert.NotEmpty(pagedList.Items);
    }

    [Fact]
    public async Task GetPublicBranchById_WhenExists_ReturnsOk()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, _) = await GetOrCreateBranchTestDataAsync(dbContext);

        // Act
        var response = await HttpClient.GetAsync($"/api/v1/branches/{branch.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var detail = await response.Content.ReadFromJsonAsync<PublicBranchDetailDto>();
        Assert.NotNull(detail);
        Assert.Equal(branch.Id, detail.Id);
    }

    [Fact]
    public async Task GetOwnerBranches_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Act - Unauthenticated call to owner endpoint
        var response = await HttpClient.GetAsync("/api/v1/owner/branches");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetOwnerBranches_WhenAuthenticatedOwner_ReturnsOk()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, owner) = await GetOrCreateBranchTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Act
        var response = await client.GetAsync("/api/v1/owner/branches");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var branches = await response.Content.ReadFromJsonAsync<IReadOnlyList<OwnerBranchListItemDto>>();
        Assert.NotNull(branches);
        Assert.Contains(branches, b => b.Id == branch.Id);
    }

    [Fact]
    public async Task UpdateBranchStatus_WhenOwner_UpdatesSuccessfully()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, owner) = await GetOrCreateBranchTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Act - Toggle status
        var payload = new UpdateBranchStatusRequest(false);
        var response = await client.PutAsJsonAsync($"/api/v1/owner/branches/{branch.Id}/status", payload);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Check DB
        using var verifyScope = Fixture.Services.CreateScope();
        var verifyDbContext = verifyScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var updated = await verifyDbContext.Branches.FirstOrDefaultAsync(b => b.Id == branch.Id);
        Assert.NotNull(updated);
        Assert.False(updated.IsActive);

        // Reset back to active for other tests
        updated.IsActive = true;
        await ((DbContext)verifyDbContext).SaveChangesAsync();
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
                Email = "courtowner@courtbooking.com",
                UserName = "courtowner@courtbooking.com",
                PhoneNumber = "0900000002",
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

    private static async Task<(Branch Branch, ApplicationUser Owner)> GetOrCreateBranchTestDataAsync(IApplicationDbContext dbContext)
    {
        var owner = await GetCourtOwnerAsync(dbContext);

        var branch = await dbContext.Branches.Include(b => b.QrImage).FirstOrDefaultAsync(b => b.CourtOwnerId == owner.Id);
        if (branch == null)
        {
            var qr = new Image
            {
                Id = Guid.NewGuid(),
                StorageKey = "branches/qr/test.png",
                StorageProvider = StorageProvider.S3,
                Status = ImageStatus.Attached,
                CreatedAt = DateTime.UtcNow,
                AttachedAt = DateTime.UtcNow
            };
            dbContext.Images.Add(qr);

            branch = new Branch
            {
                Id = Guid.NewGuid(),
                CourtOwnerId = owner.Id,
                Name = "Chi Nhánh Test Integration",
                Hotline = "0912345678",
                Province = "Hồ Chí Minh",
                District = "Quận 1",
                Street = "123 Lê Duẩn",
                OpenTime = new TimeOnly(5, 0),
                CloseTime = new TimeOnly(23, 0),
                AccountNumber = "0123456789",
                AccountName = "TEST OWNER",
                QrImageId = qr.Id,
                QrImage = qr,
                IsActive = true,
                Latitude = 10.7769m,
                Longitude = 106.7009m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Branches.Add(branch);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        return (branch, owner);
    }
}
