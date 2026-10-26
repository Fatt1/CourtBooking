using Application.UnitTests.Abstractions;
using CourtBooking.Application.Abstractions.Courts;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;

namespace Application.UnitTests.Orders;

public sealed class OrderCheckerTests : BaseHandlerTest
{
    private static readonly Guid SampleBranchId = Guid.NewGuid();
    private static readonly Guid SampleCourtId = Guid.NewGuid();
    private static readonly Guid SampleCourtTypeId = Guid.NewGuid();
    private static readonly Guid SamplePriceTableId = Guid.NewGuid();
    private static readonly DateOnly TargetDate = new(2026, 11, 20);

    [Fact]
    public void FlattenSlots_Should_CorrectlyFlattenGroupedSlots()
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
        flatSlots.Count.ShouldBe(2);
        flatSlots[0].StartTime.ShouldBe(new TimeOnly(8, 0));
        flatSlots[1].StartTime.ShouldBe(new TimeOnly(9, 0));
        flatSlots[0].CourtId.ShouldBe(SampleCourtId);
    }

    [Fact]
    public async Task ValidateBranchAsync_Should_ReturnNotFound_WhenBranchDoesNotExist()
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
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<NotFoundError>();
    }

    [Fact]
    public async Task ValidateBranchAsync_Should_ReturnBadError_WhenBranchIsInactive()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var qrImage = new Image
        {
            Id = Guid.NewGuid(),
            StorageKey = "test-qr.png",
            StorageProvider = StorageProvider.S3,
            Status = ImageStatus.Attached
        };
        context.Images.Add(qrImage);

        context.Branches.Add(new Branch
        {
            Id = branchId,
            Name = "Sân Đang Đóng Cửa",
            Hotline = "0900000000",
            Province = "TP.HCM",
            District = "Quận 1",
            Street = "123 Lê Lợi",
            AccountNumber = "111",
            AccountName = "AAA",
            IsActive = false,
            OpenTime = new TimeOnly(6, 0),
            CloseTime = new TimeOnly(22, 0),
            QrImageId = qrImage.Id,
            QrImage = qrImage
        });
        await context.SaveChangesAsync();

        IPriceCalculator priceCalculator = Substitute.For<IPriceCalculator>();
        var checker = new OrderChecker(context, priceCalculator);

        // Act
        Result<Branch> result = await checker.ValidateBranchAsync(
            branchId,
            [],
            CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldNotBeNull();
        result.Error.Message.ShouldContain("tạm ngưng hoạt động");
    }

    [Fact]
    public async Task ValidateBranchAsync_Should_ReturnBadError_WhenSlotIsOutsideOperatingHours()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var qrImage = new Image
        {
            Id = Guid.NewGuid(),
            StorageKey = "test-qr.png",
            StorageProvider = StorageProvider.S3,
            Status = ImageStatus.Attached
        };
        context.Images.Add(qrImage);

        context.Branches.Add(new Branch
        {
            Id = branchId,
            Name = "Sân Quận 1",
            Hotline = "0900000000",
            Province = "TP.HCM",
            District = "Quận 1",
            Street = "123 Lê Lợi",
            AccountNumber = "111",
            AccountName = "AAA",
            IsActive = true,
            OpenTime = new TimeOnly(7, 0),
            CloseTime = new TimeOnly(21, 0),
            QrImageId = qrImage.Id,
            QrImage = qrImage
        });
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
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldNotBeNull();
        result.Error.Message.ShouldContain("nằm ngoài giờ mở cửa");
    }

    [Fact]
    public async Task CheckConflictsAsync_Should_ReturnConflict_WhenSlotOverlapsWithExistingActiveOrder()
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
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.ShouldNotBeNull();
        result.Error.Message.ShouldContain("đã có người đặt hoặc đang giữ chỗ");
    }

    [Fact]
    public async Task CheckConflictsAsync_Should_ReturnSuccess_WhenSlotsDoNotOverlap()
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
        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task CheckConflictsAsync_Should_IgnoreCancelledOrders()
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
        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public async Task CheckConflictsAsync_Should_IgnoreExpiredAwaitingPaymentOrders()
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
        result.IsSuccess.ShouldBeTrue();
    }

    private static async Task SeedCourtAndOrderAsync(
        TestDbContext context,
        DateOnly slotDate,
        TimeOnly startTime,
        TimeOnly endTime,
        OrderStatus status,
        DateTime holdExpiresAt)
    {
        var court = new Court
        {
            Id = SampleCourtId,
            CourtTypeId = SampleCourtTypeId,
            Name = "Sân 1",
            Status = CourtStatus.Available
        };

        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = "ORD-CONFLICT-TEST",
            BranchId = SampleBranchId,
            CustomerName = "Nguoi Dat Truoc",
            CustomerPhone = "0909999999",
            Status = status,
            Channel = OrderChannel.Online,
            OrderType = OrderType.Normal,
            OrderDate = slotDate,
            HoldExpiresAt = holdExpiresAt,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var detail = new OrderDetail
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            CourtId = SampleCourtId,
            Court = court,
            Date = slotDate,
            StartTime = startTime,
            EndTime = endTime,
            Price = 100_000m
        };

        order.Details.Add(detail);

        context.Courts.Add(court);
        context.Orders.Add(order);
        context.OrderDetails.Add(detail);
        await context.SaveChangesAsync();
    }
}
