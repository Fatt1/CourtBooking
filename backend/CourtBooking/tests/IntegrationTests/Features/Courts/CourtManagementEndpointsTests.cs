using System.Net;
using System.Net.Http.Json;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Courts.Commands.CreateCourt;
using CourtBooking.Application.Features.V1.Courts.Dtos;
using CourtBooking.Application.Features.V1.CourtTypes.Commands.CreateCourtType;
using CourtBooking.Application.Features.V1.CourtTypes.Dtos;
using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.Infrastructure.Database;
using IntegrationTests.Common;
using IntegrationTests.Fixtures;
using CourtBooking.API.Endpoints.V1.Courts;
using CourtBooking.API.Endpoints.V1.CourtTypes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace IntegrationTests.Features.Courts;

public sealed class CourtManagementEndpointsTests : BaseIntegrationTest
{
    public CourtManagementEndpointsTests(ApiFixture fixture) : base(fixture)
    {
    }

    [Fact]
    public async Task GetCourtTypesByBranch_WhenOwner_ReturnsOk()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, courtType, _, owner) = await GetOrCreateCourtTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Act
        var response = await client.GetAsync($"/api/v1/owner/court-types?branchId={branch.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var courtTypes = await response.Content.ReadFromJsonAsync<IReadOnlyList<CourtTypeDto>>();
        Assert.NotNull(courtTypes);
        Assert.Contains(courtTypes, ct => ct.Id == courtType.Id);
    }

    [Fact]
    public async Task CreateCourtType_WhenValid_ReturnsCreated()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, _, _, owner) = await GetOrCreateCourtTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);
        var uniqueName = $"Loại sân mới {Guid.NewGuid():N}";
        var command = new CreateCourtTypeCommand(branch.Id, uniqueName, 60);

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/owner/court-types", command);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var createdId = await response.Content.ReadFromJsonAsync<Guid>();
        Assert.NotEqual(Guid.Empty, createdId);
    }

    [Fact]
    public async Task GetCourtsByBranch_WhenOwner_ReturnsOk()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, _, court, owner) = await GetOrCreateCourtTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Act
        var response = await client.GetAsync($"/api/v1/owner/courts?branchId={branch.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var courts = await response.Content.ReadFromJsonAsync<IReadOnlyList<CourtDto>>();
        Assert.NotNull(courts);
        Assert.Contains(courts, c => c.Id == court.Id);
    }

    [Fact]
    public async Task CreateCourt_WhenValid_ReturnsCreated()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (_, courtType, _, owner) = await GetOrCreateCourtTestDataAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);
        var uniqueName = $"Sân Test {Guid.NewGuid():N}";
        var command = new CreateCourtCommand(courtType.Id, uniqueName);

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/owner/courts", command);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var courtId = await response.Content.ReadFromJsonAsync<Guid>();
        Assert.NotEqual(Guid.Empty, courtId);
    }

    [Fact]
    public async Task GetCourtTypesByBranch_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Act
        var response = await HttpClient.GetAsync($"/api/v1/owner/court-types?branchId={Guid.NewGuid()}");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetCourtsByBranch_WhenUnauthenticated_ReturnsUnauthorized()
    {
        // Act
        var response = await HttpClient.GetAsync($"/api/v1/owner/courts?branchId={Guid.NewGuid()}");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCourtType_WhenOwner_UpdatesSuccessfully()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, _, _, owner) = await GetOrCreateCourtTestDataAsync(dbContext);

        var tempCourtType = new CourtType
        {
            Id = Guid.NewGuid(),
            BranchId = branch.Id,
            Name = $"Loại sân cần sửa {Guid.NewGuid():N}",
            MinutesConfig = 60
        };
        dbContext.CourtTypes.Add(tempCourtType);
        await ((DbContext)dbContext).SaveChangesAsync();

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);
        var updateRequest = new UpdateCourtTypeRequest("Loại sân đã sửa", 90);

        // Act
        var response = await client.PutAsJsonAsync($"/api/v1/owner/court-types/{tempCourtType.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var verifyScope = Fixture.Services.CreateScope();
        var verifyDbContext = verifyScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var updated = await verifyDbContext.CourtTypes.FirstOrDefaultAsync(ct => ct.Id == tempCourtType.Id);
        Assert.NotNull(updated);
        Assert.Equal("Loại sân đã sửa", updated.Name);
        Assert.Equal(90, updated.MinutesConfig);
    }

    [Fact]
    public async Task DeleteCourtType_WhenNoCourts_DeletesSuccessfully()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, _, _, owner) = await GetOrCreateCourtTestDataAsync(dbContext);

        var tempCourtType = new CourtType
        {
            Id = Guid.NewGuid(),
            BranchId = branch.Id,
            Name = $"Loại sân cần xóa {Guid.NewGuid():N}",
            MinutesConfig = 60
        };
        dbContext.CourtTypes.Add(tempCourtType);
        await ((DbContext)dbContext).SaveChangesAsync();

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Act
        var response = await client.DeleteAsync($"/api/v1/owner/court-types/{tempCourtType.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var verifyScope = Fixture.Services.CreateScope();
        var verifyDbContext = verifyScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var deleted = await verifyDbContext.CourtTypes.FirstOrDefaultAsync(ct => ct.Id == tempCourtType.Id);
        Assert.Null(deleted);
    }

    [Fact]
    public async Task UpdateCourt_WhenOwner_UpdatesSuccessfully()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (_, courtType, _, owner) = await GetOrCreateCourtTestDataAsync(dbContext);

        var tempCourt = new Court
        {
            Id = Guid.NewGuid(),
            CourtTypeId = courtType.Id,
            Name = $"Sân cần sửa {Guid.NewGuid():N}",
            Status = CourtStatus.Available,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Courts.Add(tempCourt);
        await ((DbContext)dbContext).SaveChangesAsync();

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);
        var updateRequest = new UpdateCourtRequest("Sân đã sửa", courtType.Id, CourtStatus.Maintenance);

        // Act
        var response = await client.PutAsJsonAsync($"/api/v1/owner/courts/{tempCourt.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var verifyScope = Fixture.Services.CreateScope();
        var verifyDbContext = verifyScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var updated = await verifyDbContext.Courts.FirstOrDefaultAsync(c => c.Id == tempCourt.Id);
        Assert.NotNull(updated);
        Assert.Equal("Sân đã sửa", updated.Name);
        Assert.Equal(CourtStatus.Maintenance, updated.Status);
    }

    [Fact]
    public async Task DeleteCourt_WhenNoBookings_DeletesSuccessfully()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (_, courtType, _, owner) = await GetOrCreateCourtTestDataAsync(dbContext);

        var tempCourt = new Court
        {
            Id = Guid.NewGuid(),
            CourtTypeId = courtType.Id,
            Name = $"Sân cần xóa {Guid.NewGuid():N}",
            Status = CourtStatus.Available,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Courts.Add(tempCourt);
        await ((DbContext)dbContext).SaveChangesAsync();

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Act
        var response = await client.DeleteAsync($"/api/v1/owner/courts/{tempCourt.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var verifyScope = Fixture.Services.CreateScope();
        var verifyDbContext = verifyScope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var deleted = await verifyDbContext.Courts.FirstOrDefaultAsync(c => c.Id == tempCourt.Id);
        Assert.Null(deleted);
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

    private static async Task<(Branch Branch, CourtType CourtType, Court Court, ApplicationUser Owner)> GetOrCreateCourtTestDataAsync(IApplicationDbContext dbContext)
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
                Name = "Chi Nhánh Test Courts",
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

        var courtType = await dbContext.CourtTypes.FirstOrDefaultAsync(ct => ct.BranchId == branch.Id);
        if (courtType == null)
        {
            courtType = new CourtType
            {
                Id = Guid.NewGuid(),
                BranchId = branch.Id,
                Name = "Loại Sân Cầu Lông Đôi",
                MinutesConfig = 60
            };
            dbContext.CourtTypes.Add(courtType);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        var court = await dbContext.Courts.FirstOrDefaultAsync(c => c.CourtTypeId == courtType.Id && c.Status == CourtStatus.Available);
        if (court == null)
        {
            court = new Court
            {
                Id = Guid.NewGuid(),
                CourtTypeId = courtType.Id,
                Name = "Sân 1",
                Status = CourtStatus.Available,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Courts.Add(court);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        return (branch, courtType, court, owner);
    }
}
