using System.Net;
using System.Net.Http.Json;
using CourtBooking.API.Endpoints.V1.Pricing;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Pricing.Dtos;
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

namespace IntegrationTests.Features.Pricing;

public sealed class PricingEndpointsTests : BaseIntegrationTest
{
    public PricingEndpointsTests(ApiFixture fixture) : base(fixture)
    {
    }

    [Fact]
    public async Task GetPublicBranchPricingConfig_ReturnsOk()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, _, _, _) = await GetOrCreatePricingTestDataAsync(dbContext);

        // Act - Public endpoint, unauthenticated
        var response = await HttpClient.GetAsync($"/api/v1/pricing?branchId={branch.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var configs = await response.Content.ReadFromJsonAsync<IReadOnlyList<CourtTypePricingConfigDto>>();
        Assert.NotNull(configs);
        Assert.NotEmpty(configs);
    }

    [Fact]
    public async Task GetCourtTypePricingConfig_WhenOwner_ReturnsOk()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, courtType, _, _) = await GetOrCreatePricingTestDataAsync(dbContext);
        var owner = await GetCourtOwnerAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Act
        var response = await client.GetAsync($"/api/v1/owner/pricing?branchId={branch.Id}&courtTypeId={courtType.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var config = await response.Content.ReadFromJsonAsync<CourtTypePricingConfigDto>();
        Assert.NotNull(config);
        Assert.Equal(courtType.Id, config.CourtTypeId);
        Assert.Equal(branch.Id, config.BranchId);
    }

    [Fact]
    public async Task CreatePriceTable_WhenValid_ReturnsCreated_AndWhenDuplicate_ReturnsConflict()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, courtType, _, _) = await GetOrCreatePricingTestDataAsync(dbContext);
        var owner = await GetCourtOwnerAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);
        var tableName = $"Bảng giá VIP {Guid.NewGuid():N}";

        var request = new CreatePriceTableRequest(
            courtType.Id,
            tableName,
            150000m,
            180000m,
            true);

        // Act 1: Tạo mới thành công
        var createResponse = await client.PostAsJsonAsync($"/api/v1/owner/pricing/price-tables?branchId={branch.Id}", request);

        // Assert 1
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        // Act 2: Trùng tên trong cùng loại sân -> Conflict (409)
        var duplicateResponse = await client.PostAsJsonAsync($"/api/v1/owner/pricing/price-tables?branchId={branch.Id}", request);

        // Assert 2
        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);
    }

    [Fact]
    public async Task UpdatePriceTable_WhenValid_ReturnsNoContent()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, courtType, _, _) = await GetOrCreatePricingTestDataAsync(dbContext);
        var owner = await GetCourtOwnerAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);
        var originalName = $"Bảng giá trước sửa {Guid.NewGuid():N}";

        var createReq = new CreatePriceTableRequest(courtType.Id, originalName, 100000m, 120000m, true);
        var createRes = await client.PostAsJsonAsync($"/api/v1/owner/pricing/price-tables?branchId={branch.Id}", createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);

        var createdTable = await dbContext.PriceTables.FirstOrDefaultAsync(pt => pt.Name == originalName);
        Assert.NotNull(createdTable);

        var updateReq = new UpdatePriceTableRequest(
            $"{originalName} - Đã sửa",
            120000m,
            140000m,
            true);

        // Act
        var updateRes = await client.PutAsJsonAsync(
            $"/api/v1/owner/pricing/price-tables/{createdTable.Id}?branchId={branch.Id}", updateReq);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, updateRes.StatusCode);
    }

    [Fact]
    public async Task PriceTableRule_Lifecycle_Create_OverlapConflict_Update_Delete()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, courtType, _, _) = await GetOrCreatePricingTestDataAsync(dbContext);
        var owner = await GetCourtOwnerAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Tạo bảng giá riêng cho test này
        var tableReq = new CreatePriceTableRequest(courtType.Id, $"Bảng giá Lifecycle {Guid.NewGuid():N}", 100000m, 120000m, true);
        await client.PostAsJsonAsync($"/api/v1/owner/pricing/price-tables?branchId={branch.Id}", tableReq);
        var table = await dbContext.PriceTables.FirstAsync(pt => pt.Name == tableReq.Name);

        // 1. Thêm Rule mới: 08:00 - 12:00, T2-T6
        var rule1Req = new CreatePriceTableRuleRequest(
            null, null, 1, 5, new TimeOnly(8, 0), new TimeOnly(12, 0), 80000m, 100000m);

        var rule1Res = await client.PostAsJsonAsync(
            $"/api/v1/owner/pricing/price-tables/{table.Id}/rules?branchId={branch.Id}", rule1Req);

        Assert.Equal(HttpStatusCode.Created, rule1Res.StatusCode);

        // 2. Thêm Rule trùng lấn: 10:00 - 14:00, T2-T6 -> 409 Conflict
        var overlappingReq = new CreatePriceTableRuleRequest(
            null, null, 1, 5, new TimeOnly(10, 0), new TimeOnly(14, 0), 90000m, 110000m);

        var overlapRes = await client.PostAsJsonAsync(
            $"/api/v1/owner/pricing/price-tables/{table.Id}/rules?branchId={branch.Id}", overlappingReq);

        Assert.Equal(HttpStatusCode.Conflict, overlapRes.StatusCode);

        // 3. Sửa Rule 1 thành: 07:00 - 11:00
        var savedRule = await dbContext.PriceTableRules.FirstAsync(r => r.PriceTableId == table.Id);
        var updateRuleReq = new UpdatePriceTableRuleRequest(
            null, null, 1, 5, new TimeOnly(7, 0), new TimeOnly(11, 0), 85000m, 105000m);

        var updateRuleRes = await client.PutAsJsonAsync(
            $"/api/v1/owner/pricing/price-tables/{table.Id}/rules/{savedRule.Id}?branchId={branch.Id}", updateRuleReq);

        Assert.Equal(HttpStatusCode.NoContent, updateRuleRes.StatusCode);

        // 4. Xóa Rule 1 -> 204 NoContent
        var deleteRuleRes = await client.DeleteAsync(
            $"/api/v1/owner/pricing/price-tables/{table.Id}/rules/{savedRule.Id}?branchId={branch.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteRuleRes.StatusCode);
    }

    [Fact]
    public async Task FixedTimeBlock_Lifecycle_Create_OverlapConflict_Delete()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, courtType, court, _) = await GetOrCreatePricingTestDataAsync(dbContext);
        var owner = await GetCourtOwnerAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // 1. Tạo FixedTimeBlock: 17:30 - 19:30, T7-CN (0, 6)
        var createBlockReq = new CreateFixedTimeBlockRequest(
            courtType.Id,
            new TimeOnly(17, 30),
            new TimeOnly(19, 30),
            [0, 6],
            [court.Id]);

        var createRes = await client.PostAsJsonAsync(
            $"/api/v1/owner/pricing/fixed-time-blocks?branchId={branch.Id}", createBlockReq);

        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);

        // 2. Tạo khung giờ trùng lấn trên cùng sân vào CN (0): 18:00 - 20:00 -> 409 Conflict
        var overlapBlockReq = new CreateFixedTimeBlockRequest(
            courtType.Id,
            new TimeOnly(18, 0),
            new TimeOnly(20, 0),
            [0],
            [court.Id]);

        var overlapRes = await client.PostAsJsonAsync(
            $"/api/v1/owner/pricing/fixed-time-blocks?branchId={branch.Id}", overlapBlockReq);

        Assert.Equal(HttpStatusCode.Conflict, overlapRes.StatusCode);

        // 3. Xóa FixedTimeBlock vừa tạo -> 204 NoContent
        var createdBlock = await dbContext.FixedTimeBlocks
            .FirstAsync(b => b.CourtTypeId == courtType.Id && b.StartTime == new TimeOnly(17, 30));

        var deleteRes = await client.DeleteAsync(
            $"/api/v1/owner/pricing/fixed-time-blocks/{createdBlock.Id}?branchId={branch.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);
    }

    [Fact]
    public async Task DeletePriceTable_WhenOnlyOneTableRemaining_ReturnsConflict_WhenMultiple_ReturnsNoContent()
    {
        // Arrange
        using var scope = Fixture.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var (branch, courtType, _, _) = await GetOrCreatePricingTestDataAsync(dbContext);
        var owner = await GetCourtOwnerAsync(dbContext);

        using var client = CreateAuthenticatedClient(owner, [RoleConstants.CourtOwner]);

        // Đảm bảo có ít nhất 2 bảng giá
        var extraTableName = $"Bảng giá phụ {Guid.NewGuid():N}";
        var extraReq = new CreatePriceTableRequest(courtType.Id, extraTableName, 110000m, 130000m, true);
        await client.PostAsJsonAsync($"/api/v1/owner/pricing/price-tables?branchId={branch.Id}", extraReq);

        var extraTable = await dbContext.PriceTables.FirstAsync(pt => pt.Name == extraTableName);

        // Xóa bảng giá phụ khi đang có >= 2 bảng giá -> thành công 204
        var deleteRes = await client.DeleteAsync(
            $"/api/v1/owner/pricing/price-tables/{extraTable.Id}?branchId={branch.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);

        // Tìm bảng giá còn lại cuối cùng
        var remainingTable = await dbContext.PriceTables.FirstAsync(pt => pt.CourtTypeId == courtType.Id);

        // Xóa bảng giá cuối cùng -> 409 Conflict
        var deleteLastRes = await client.DeleteAsync(
            $"/api/v1/owner/pricing/price-tables/{remainingTable.Id}?branchId={branch.Id}");

        Assert.Equal(HttpStatusCode.Conflict, deleteLastRes.StatusCode);
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

    private static async Task<(Branch Branch, CourtType CourtType, Court Court, PriceTable PriceTable)> GetOrCreatePricingTestDataAsync(IApplicationDbContext dbContext)
    {
        var branch = await dbContext.Branches.Include(b => b.QrImage).FirstOrDefaultAsync(b => b.IsActive);
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
                CourtOwnerId = DatabaseSeeder.CourtOwnerUserId,
                Name = "Chi Nhánh Test Pricing",
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
                Name = "Loại Sân Cầu Lông Test",
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
                Name = "Sân 1 - Test",
                Status = CourtStatus.Available,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Courts.Add(court);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        var priceTable = await dbContext.PriceTables.FirstOrDefaultAsync(pt => pt.CourtTypeId == courtType.Id && pt.IsActive);
        if (priceTable == null)
        {
            priceTable = new PriceTable
            {
                Id = Guid.NewGuid(),
                CourtTypeId = courtType.Id,
                Name = "Bảng Giá Mặc Định Test",
                DefaultPrice = 100_000m,
                DefaultWalkInPrice = 120_000m,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.PriceTables.Add(priceTable);
            await ((DbContext)dbContext).SaveChangesAsync();
        }

        return (branch, courtType, court, priceTable);
    }
}
