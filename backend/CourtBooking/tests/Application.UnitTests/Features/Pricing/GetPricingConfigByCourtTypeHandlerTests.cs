using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Pricing.Dtos;
using CourtBooking.Application.Features.V1.Pricing.Queries.GetPricingConfigByCourtType;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;

namespace Application.UnitTests.Features.Pricing;

public sealed class GetPricingConfigByCourtTypeHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();

    [Fact]
    public async Task Handle_WhenBranchAuthFails_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();
        var courtTypeId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Bạn không có quyền quản lý chi nhánh này.")));

        var handler = new GetPricingConfigByCourtTypeHandler(context, _branchAuth);
        var query = new GetPricingConfigByCourtTypeQuery(branchId, courtTypeId);

        // Act
        Result<CourtTypePricingConfigDto> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenCourtTypeDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();
        var courtTypeId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new GetPricingConfigByCourtTypeHandler(context, _branchAuth);
        var query = new GetPricingConfigByCourtTypeQuery(branchId, courtTypeId);

        // Act
        Result<CourtTypePricingConfigDto> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenCourtTypeBelongsToDifferentBranch_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId1 = Guid.CreateVersion7();
        var branchId2 = Guid.CreateVersion7();

        var courtType = new CourtTypeBuilder()
            .WithBranchId(branchId2)
            .Build();

        context.CourtTypes.Add(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId1, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new GetPricingConfigByCourtTypeHandler(context, _branchAuth);
        var query = new GetPricingConfigByCourtTypeQuery(branchId1, courtType.Id);

        // Act
        Result<CourtTypePricingConfigDto> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenCourtTypeExists_ReturnsPricingConfigWithDecodedBlocksAndRules()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var court1 = new CourtBuilder().WithName("Sân 1").Build();
        var court2 = new CourtBuilder().WithName("Sân 2").Build();

        var priceTable = new PriceTableBuilder()
            .WithName("Bảng giá ban ngày")
            .WithRule(new TimeOnly(8, 0), new TimeOnly(17, 0), dayFrom: 1, dayTo: 5, fixedPrice: 70000m, walkInPrice: 90000m)
            .Build();

        var fixedBlockId = Guid.CreateVersion7();
        var fixedBlock = new FixedTimeBlock
        {
            Id = fixedBlockId,
            StartTime = new TimeOnly(18, 0),
            EndTime = new TimeOnly(20, 0),
            DaysOfWeekMask = 42, // Thứ 2, 4, 6
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        fixedBlock.Courts.Add(new FixedTimeBlockCourt
        {
            FixedTimeBlockId = fixedBlockId,
            CourtId = court1.Id,
            Court = court1
        });

        var courtType = new CourtTypeBuilder()
            .WithBranchId(branchId)
            .WithName("Sân Cầu Lông Đơn")
            .WithMinutesConfig(60)
            .WithCourt(court1)
            .WithCourt(court2)
            .WithPriceTable(priceTable)
            .WithFixedTimeBlock(fixedBlock)
            .Build();

        context.CourtTypes.Add(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new GetPricingConfigByCourtTypeHandler(context, _branchAuth);
        var query = new GetPricingConfigByCourtTypeQuery(branchId, courtType.Id);

        // Act
        Result<CourtTypePricingConfigDto> result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        var config = result.Value;
        config.ShouldNotBeNull();
        config.CourtTypeId.ShouldBe(courtType.Id);
        config.BranchId.ShouldBe(branchId);
        config.CourtTypeName.ShouldBe("Sân Cầu Lông Đơn");
        config.MinutesConfig.ShouldBe(60);

        // Courts
        config.AvailableCourts.Count.ShouldBe(2);

        // Fixed Time Blocks
        config.FixedTimeBlocks.Count.ShouldBe(1);
        var blockDto = config.FixedTimeBlocks[0];
        blockDto.DaysOfWeekMask.ShouldBe(42);
        blockDto.DaysOfWeek.ShouldBe([1, 3, 5]);
        blockDto.DayNames.ShouldBe(["T2", "T4", "T6"]);
        blockDto.AppliedCourts.Count.ShouldBe(1);
        blockDto.AppliedCourts[0].CourtId.ShouldBe(court1.Id);

        // Price Tables
        config.PriceTables.Count.ShouldBe(1);
        var tableDto = config.PriceTables[0];
        tableDto.Name.ShouldBe("Bảng giá ban ngày");
        tableDto.Rules.Count.ShouldBe(1);
        tableDto.Rules[0].DayOfWeekRangeText.ShouldBe("T2 - T6");
    }
}
