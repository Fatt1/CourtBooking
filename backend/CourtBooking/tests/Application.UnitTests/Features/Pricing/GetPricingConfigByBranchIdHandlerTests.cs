using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Features.V1.Pricing.Queries.GetPricingConfigByBranchId;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;

namespace Application.UnitTests.Features.Pricing;

public sealed class GetPricingConfigByBranchIdHandlerTests : BaseHandlerTest
{
    [Fact]
    public async Task Handle_WhenBranchDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var nonExistentBranchId = Guid.CreateVersion7();

        var handler = new GetPricingConfigByBranchIdHandler(context);
        var query = new GetPricingConfigByBranchIdQuery(nonExistentBranchId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenBranchExistsButHasNoCourtTypes_ReturnsEmptyList()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branch = new BranchBuilder().WithActive(true).Build();

        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var handler = new GetPricingConfigByBranchIdHandler(context);
        var query = new GetPricingConfigByBranchIdQuery(branch.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Empty(result.Value);
    }

    [Fact]
    public async Task Handle_WhenBranchHasCourtTypesWithPricing_ReturnsConfigList()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branch = new BranchBuilder().WithActive(true).Build();
        var courtType = new CourtTypeBuilder()
            .WithBranchId(branch.Id)
            .WithName("Sân Cầu Lông VIP")
            .Build();

        var court = new CourtBuilder()
            .WithCourtTypeId(courtType.Id)
            .WithName("Sân 1")
            .WithStatus(CourtStatus.Available)
            .Build();

        var priceTable = new PriceTableBuilder()
            .WithCourtTypeId(courtType.Id)
            .WithName("Bảng giá tiêu chuẩn")
            .WithActive(true)
            .Build();

        var rule = new PriceTableRule
        {
            Id = Guid.CreateVersion7(),
            PriceTableId = priceTable.Id,
            DayOfWeekFrom = 1,
            DayOfWeekTo = 5,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(17, 0),
            FixedCustomerPrice = 80000m,
            WalkInCustomerPrice = 100000m
        };

        var fixedBlock = new FixedTimeBlock
        {
            Id = Guid.CreateVersion7(),
            CourtTypeId = courtType.Id,
            StartTime = new TimeOnly(17, 30),
            EndTime = new TimeOnly(19, 30),
            DaysOfWeekMask = 65, // Sat, Sun
            Courts = [new FixedTimeBlockCourt { CourtId = court.Id }]
        };

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.Courts.AddAsync(court);
        await context.PriceTables.AddAsync(priceTable);
        await context.PriceTableRules.AddAsync(rule);
        await context.FixedTimeBlocks.AddAsync(fixedBlock);
        await context.SaveChangesAsync();

        var handler = new GetPricingConfigByBranchIdHandler(context);
        var query = new GetPricingConfigByBranchIdQuery(branch.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Single(result.Value);

        var config = result.Value[0];
        Assert.Equal(courtType.Id, config.CourtTypeId);
        Assert.Equal("Sân Cầu Lông VIP", config.CourtTypeName);
        Assert.Single(config.AvailableCourts);
        Assert.Single(config.PriceTables);
        Assert.Single(config.FixedTimeBlocks);

        var table = config.PriceTables[0];
        Assert.Equal("Bảng giá tiêu chuẩn", table.Name);
        Assert.Single(table.Rules);

        var block = config.FixedTimeBlocks[0];
        Assert.Equal(new TimeOnly(17, 30), block.StartTime);
        Assert.Equal(new TimeOnly(19, 30), block.EndTime);
        Assert.Equal(2, block.DaysOfWeek.Count);
        Assert.Contains(0, block.DaysOfWeek);
        Assert.Contains(6, block.DaysOfWeek);
    }
}
