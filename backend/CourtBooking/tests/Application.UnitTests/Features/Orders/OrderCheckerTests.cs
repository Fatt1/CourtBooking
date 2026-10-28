using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Courts;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;

namespace Application.UnitTests.Features.Orders;

public sealed class OrderCheckerTests : BaseHandlerTest
{
    private static readonly Guid SampleBranchId = Guid.NewGuid();
    private static readonly Guid SampleCourtId = Guid.NewGuid();
    private static readonly Guid SampleCourtTypeId = Guid.NewGuid();
    private static readonly Guid SamplePriceTableId = Guid.NewGuid();
    private static readonly DateOnly TargetDate = new(2026, 11, 20);

    [Fact]
    public void FlattenSlots_WhenGroupedSlotsProvided_FlattensCorrectly()
    {
        // Arrange
        using TestDbContext context = CreateDbContext();
        IPriceCalculator priceCalculator = Substitute.For<IPriceCalculator>();
        var checker = new OrderChecker(context, priceCalculator);

        var groupedSlots = new List<CourtBookingSlot>
        {
            new(
                SampleCourtTypeId,
                SamplePriceTableId,
                [
                    new CourtSlotItem(SampleCourtId, TargetDate, new TimeOnly(8, 0), new TimeOnly(9, 0)),
                    new CourtSlotItem(SampleCourtId, TargetDate, new TimeOnly(9, 0), new TimeOnly(10, 0))
                ]
            )
        };

        // Act
        List<FlatSlotItem> flatSlots = checker.FlattenSlots(groupedSlots);

        // Assert
        Assert.Equal(2, flatSlots.Count);
        Assert.Equal(new TimeOnly(8, 0), flatSlots[0].StartTime);
        Assert.Equal(new TimeOnly(9, 0), flatSlots[1].StartTime);
        Assert.Equal(SampleCourtId, flatSlots[0].CourtId);
    }

    [Fact]
    public async Task ValidateBranchAsync_WhenBranchDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        IPriceCalculator priceCalculator = Substitute.For<IPriceCalculator>();
        var checker = new OrderChecker(context, priceCalculator);

        // Act
        Result<Branch> result = await checker.ValidateBranchAsync(
            Guid.NewGuid(),
            [],
            CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task ValidateBranchAsync_WhenBranchIsInactive_ReturnsBadError()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var branch = new BranchBuilder()
            .WithId(branchId)
            .WithName("Sân Đang Đóng Cửa")
            .WithActive(false)
            .Build();

        context.Images.Add(branch.QrImage!);
        context.Branches.Add(branch);
        await context.SaveChangesAsync();

        IPriceCalculator priceCalculator = Substitute.For<IPriceCalculator>();
        var checker = new OrderChecker(context, priceCalculator);

        // Act
        Result<Branch> result = await checker.ValidateBranchAsync(
            branchId,
            [],
            CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.NotNull(result.Error);
        Assert.Contains("tạm ngưng hoạt động", result.Error.Message);
    }

    [Fact]
    public async Task ValidateBranchAsync_WhenSlotIsOutsideOperatingHours_ReturnsBadError()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var branch = new BranchBuilder()
            .WithId(branchId)
            .WithName("Sân Quận 1")
            .WithOperatingHours(new TimeOnly(7, 0), new TimeOnly(21, 0))
            .WithActive(true)
            .Build();

        context.Images.Add(branch.QrImage!);
        context.Branches.Add(branch);
        await context.SaveChangesAsync();

        IPriceCalculator priceCalculator = Substitute.For<IPriceCalculator>();
        var checker = new OrderChecker(context, priceCalculator);

        var slotsOutsideHours = new List<FlatSlotItem>
        {
            new(SampleCourtTypeId, SamplePriceTableId, SampleCourtId, TargetDate, new TimeOnly(6, 0), new TimeOnly(7, 0))
        };

        // Act
        Result<Branch> result = await checker.ValidateBranchAsync(
            branchId,
            slotsOutsideHours,
            CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.NotNull(result.Error);
        Assert.Contains("nằm ngoài giờ mở cửa", result.Error.Message);
    }

    [Fact]
    public async Task CheckConflictsAsync_WhenSlotOverlapsWithExistingActiveOrder_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedCourtAndOrderAsync(context,
            slotDate: TargetDate,
            startTime: new TimeOnly(8, 0),
            endTime: new TimeOnly(10, 0),
            status: OrderStatus.Confirmed,
            holdExpiresAt: DateTime.UtcNow.AddHours(1));

        IPriceCalculator priceCalculator = Substitute.For<IPriceCalculator>();
        var checker = new OrderChecker(context, priceCalculator);

        // Overlapping slot: 09:00 - 11:00 (overlaps from 09:00 to 10:00)
        var testSlots = new List<FlatSlotItem>
        {
            new(SampleCourtTypeId, SamplePriceTableId, SampleCourtId, TargetDate, new TimeOnly(9, 0), new TimeOnly(11, 0))
        };

        // Act
        Result result = await checker.CheckConflictsAsync(testSlots, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
        Assert.Contains("đã có người đặt hoặc đang giữ chỗ", result.Error.Message);
    }

    [Fact]
    public async Task CheckConflictsAsync_WhenSlotsDoNotOverlap_ReturnsSuccess()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedCourtAndOrderAsync(context,
            slotDate: TargetDate,
            startTime: new TimeOnly(8, 0),
            endTime: new TimeOnly(10, 0),
            status: OrderStatus.Confirmed,
            holdExpiresAt: DateTime.UtcNow.AddHours(1));

        IPriceCalculator priceCalculator = Substitute.For<IPriceCalculator>();
        var checker = new OrderChecker(context, priceCalculator);

        // Non-overlapping slot: 10:00 - 11:00
        var testSlots = new List<FlatSlotItem>
        {
            new(SampleCourtTypeId, SamplePriceTableId, SampleCourtId, TargetDate, new TimeOnly(10, 0), new TimeOnly(11, 0))
        };

        // Act
        Result result = await checker.CheckConflictsAsync(testSlots, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task CheckConflictsAsync_WhenOrderIsCancelled_IgnoresCancelledOrder()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedCourtAndOrderAsync(context,
            slotDate: TargetDate,
            startTime: new TimeOnly(8, 0),
            endTime: new TimeOnly(10, 0),
            status: OrderStatus.Cancelled,
            holdExpiresAt: DateTime.UtcNow.AddHours(1));

        IPriceCalculator priceCalculator = Substitute.For<IPriceCalculator>();
        var checker = new OrderChecker(context, priceCalculator);

        // Exactly the same time as the cancelled order
        var testSlots = new List<FlatSlotItem>
        {
            new(SampleCourtTypeId, SamplePriceTableId, SampleCourtId, TargetDate, new TimeOnly(8, 0), new TimeOnly(10, 0))
        };

        // Act
        Result result = await checker.CheckConflictsAsync(testSlots, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
    }

    [Fact]
    public async Task CheckConflictsAsync_WhenHoldIsExpired_IgnoresExpiredAwaitingPaymentOrder()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        await SeedCourtAndOrderAsync(context,
            slotDate: TargetDate,
            startTime: new TimeOnly(8, 0),
            endTime: new TimeOnly(10, 0),
            status: OrderStatus.AwaitingPayment,
            holdExpiresAt: DateTime.UtcNow.AddMinutes(-5)); // Expired hold

        IPriceCalculator priceCalculator = Substitute.For<IPriceCalculator>();
        var checker = new OrderChecker(context, priceCalculator);

        // Slot overlaps expired hold
        var testSlots = new List<FlatSlotItem>
        {
            new(SampleCourtTypeId, SamplePriceTableId, SampleCourtId, TargetDate, new TimeOnly(8, 30), new TimeOnly(9, 30))
        };

        // Act
        Result result = await checker.CheckConflictsAsync(testSlots, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
    }

    private static async Task SeedCourtAndOrderAsync(
        TestDbContext context,
        DateOnly slotDate,
        TimeOnly startTime,
        TimeOnly endTime,
        OrderStatus status,
        DateTime holdExpiresAt)
    {
        var court = new CourtBuilder()
            .WithId(SampleCourtId)
            .WithCourtTypeId(SampleCourtTypeId)
            .WithName("Sân 1")
            .WithStatus(CourtStatus.Available)
            .Build();

        var order = new OrderBuilder()
            .WithId(Guid.NewGuid())
            .WithOrderCode("ORD-CONFLICT-TEST")
            .WithBranchId(SampleBranchId)
            .WithCustomer("Nguoi Dat Truoc", "0909999999")
            .WithStatus(status)
            .WithHoldExpiresAt(holdExpiresAt)
            .WithCourtAmount(100_000m)
            .WithDetail(SampleCourtId, slotDate, startTime, endTime, 100_000m, court)
            .Build();

        context.Courts.Add(court);
        context.Orders.Add(order);
        await context.SaveChangesAsync();
    }
}
