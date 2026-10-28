using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using AsyncKeyedLock;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Orders.Commands.CreateOrderOnline;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Orders;

public sealed class CreateOrderOnlineCommandHandlerTests : BaseHandlerTest
{
    private static readonly Guid PlayerId = Guid.NewGuid();
    private static readonly Guid BranchId = Guid.NewGuid();
    private static readonly Guid CourtId = Guid.NewGuid();
    private static readonly Guid CourtTypeId = Guid.NewGuid();
    private static readonly Guid PriceTableId = Guid.NewGuid();
    private static readonly Guid ServiceId = Guid.NewGuid();

    [Fact]
    public async Task Handle_WhenValidationFails_ReturnsFailure()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        IOrderChecker bookingValidator = Substitute.For<IOrderChecker>();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(PlayerId);
        using var keyedLocker = new AsyncKeyedLocker<string>();

        var error = new BadError("Chi nhánh này hiện đang tạm ngưng hoạt động.");
        bookingValidator.ValidateBookingAsync(
            Arg.Any<Guid>(),
            Arg.Any<List<CourtBookingSlot>>(),
            Arg.Any<List<OrderServiceItem>?>(),
            false,
            Arg.Any<CancellationToken>())
            .Returns(Result.Failure<BookingValidationContext>(error));

        var handler = new CreateOrderOnlineCommandHandler(context, bookingValidator, userContext, keyedLocker);
        var command = CreateSampleCommand();

        // Act
        Result<CreateOrderOnlineResponse> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(error, result.Error);
    }

    [Fact]
    public async Task Handle_WhenCheckConflictsFails_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        IOrderChecker bookingValidator = Substitute.For<IOrderChecker>();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(PlayerId);
        using var keyedLocker = new AsyncKeyedLocker<string>();

        var bookingContext = CreateSampleBookingContext();
        bookingValidator.ValidateBookingAsync(
            Arg.Any<Guid>(),
            Arg.Any<List<CourtBookingSlot>>(),
            Arg.Any<List<OrderServiceItem>?>(),
            false,
            Arg.Any<CancellationToken>())
            .Returns(Result.Success(bookingContext));

        var conflictError = new ConflictError("Sân 'Sân 1' vào khung giờ 08:00 - 09:00 ngày 20/11/2026 đã có người đặt.");
        bookingValidator.CheckConflictsAsync(Arg.Any<List<FlatSlotItem>>(), Arg.Any<CancellationToken>())
            .Returns(Result.Failure(conflictError));

        var handler = new CreateOrderOnlineCommandHandler(context, bookingValidator, userContext, keyedLocker);
        var command = CreateSampleCommand();

        // Act
        Result<CreateOrderOnlineResponse> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(conflictError, result.Error);
    }

    [Fact]
    public async Task Handle_WhenPlayerNotAuthenticated_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        IOrderChecker bookingValidator = Substitute.For<IOrderChecker>();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(Guid.Empty);
        using var keyedLocker = new AsyncKeyedLocker<string>();

        var bookingContext = CreateSampleBookingContext();
        bookingValidator.ValidateBookingAsync(
            Arg.Any<Guid>(),
            Arg.Any<List<CourtBookingSlot>>(),
            Arg.Any<List<OrderServiceItem>?>(),
            false,
            Arg.Any<CancellationToken>())
            .Returns(Result.Success(bookingContext));

        bookingValidator.CheckConflictsAsync(Arg.Any<List<FlatSlotItem>>(), Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateOrderOnlineCommandHandler(context, bookingValidator, userContext, keyedLocker);
        var command = CreateSampleCommand(useDefaultPlayer: false);

        // Act
        Result<CreateOrderOnlineResponse> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenRequestIsValid_CreatesOrderSuccessfully()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        IOrderChecker bookingValidator = Substitute.For<IOrderChecker>();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(PlayerId);
        using var keyedLocker = new AsyncKeyedLocker<string>();

        var bookingContext = CreateSampleBookingContext();
        bookingValidator.ValidateBookingAsync(
            Arg.Any<Guid>(),
            Arg.Any<List<CourtBookingSlot>>(),
            Arg.Any<List<OrderServiceItem>?>(),
            false,
            Arg.Any<CancellationToken>())
            .Returns(Result.Success(bookingContext));

        bookingValidator.CheckConflictsAsync(Arg.Any<List<FlatSlotItem>>(), Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateOrderOnlineCommandHandler(context, bookingValidator, userContext, keyedLocker);
        var command = CreateSampleCommand();

        // Act
        Result<CreateOrderOnlineResponse> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotEqual(Guid.Empty, result.Value.OrderId);
        Assert.StartsWith("ORD-", result.Value.OrderCode);
        Assert.Equal(100_000m, result.Value.TotalAmount);
        Assert.Equal("123456789", result.Value.AccountNumber);
        Assert.Equal("NGUYEN VAN A", result.Value.AccountName);
        Assert.Equal("branches/qr/branch1.png", result.Value.QrCodeImageKey);

        Order savedOrder = await context.Orders
            .Include(o => o.Details)
            .SingleAsync(o => o.Id == result.Value.OrderId);

        Assert.Equal(BranchId, savedOrder.BranchId);
        Assert.Equal(PlayerId, savedOrder.PlayerId);
        Assert.Equal("Nguyen Van B", savedOrder.CustomerName);
        Assert.Equal("0901234567", savedOrder.CustomerPhone);
        Assert.Equal(OrderStatus.AwaitingPayment, savedOrder.Status);
        Assert.Equal(OrderChannel.Online, savedOrder.Channel);
        Assert.Equal(100_000m, savedOrder.TotalCourtAmount);
        Assert.Single(savedOrder.Details);
        Assert.Equal(CourtId, savedOrder.Details[0].CourtId);
        Assert.Equal(100_000m, savedOrder.Details[0].Price);
    }

    [Fact]
    public async Task Handle_WhenServicesIncluded_CreatesOrderWithServicesSuccessfully()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        IOrderChecker bookingValidator = Substitute.For<IOrderChecker>();
        IUserContext userContext = Substitute.For<IUserContext>();
        userContext.UserId.Returns(PlayerId);
        using var keyedLocker = new AsyncKeyedLocker<string>();

        var bookingContext = CreateSampleBookingContext(withService: true);
        bookingValidator.ValidateBookingAsync(
            Arg.Any<Guid>(),
            Arg.Any<List<CourtBookingSlot>>(),
            Arg.Any<List<OrderServiceItem>?>(),
            false,
            Arg.Any<CancellationToken>())
            .Returns(Result.Success(bookingContext));

        bookingValidator.CheckConflictsAsync(Arg.Any<List<FlatSlotItem>>(), Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateOrderOnlineCommandHandler(context, bookingValidator, userContext, keyedLocker);
        var command = CreateSampleCommand(withService: true);

        // Act
        Result<CreateOrderOnlineResponse> result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        Order savedOrder = await context.Orders
            .Include(o => o.Services)
            .SingleAsync(o => o.Id == result.Value.OrderId);

        Assert.Single(savedOrder.Services);
        Assert.Equal(ServiceId, savedOrder.Services[0].ServiceId);
        Assert.Equal(15_000m, savedOrder.Services[0].UnitPrice);
        Assert.Equal(2, savedOrder.Services[0].Quantity);
        Assert.Equal(30_000m, savedOrder.TotalServiceAmount);
        Assert.Equal(130_000m, savedOrder.TotalAmount);
    }

    private static CreateOrderOnlineCommand CreateSampleCommand(bool withService = false, Guid? playerId = null, bool useDefaultPlayer = true)
    {
        var courtSlots = new List<CourtBookingSlot>
        {
            new(
                CourtTypeId,
                PriceTableId,
                [new CourtSlotItem(CourtId, new DateOnly(2026, 11, 20), new TimeOnly(8, 0), new TimeOnly(9, 0))]
            )
        };

        List<OrderServiceItem>? services = withService
            ? [new OrderServiceItem(ServiceId, 2)]
            : null;

        return new CreateOrderOnlineCommand(
            BranchId,
            "Nguyen Van B",
            "0901234567",
            "Đặt sân buổi sáng",
            courtSlots,
            services,
            useDefaultPlayer ? (playerId ?? PlayerId) : null);
    }

    private static BookingValidationContext CreateSampleBookingContext(bool withService = false)
    {
        var branch = new BranchBuilder()
            .WithId(BranchId)
            .WithName("Chi nhánh Tân Bình")
            .WithQrImage("branches/qr/branch1.png")
            .Build();

        var court = new CourtBuilder()
            .WithId(CourtId)
            .WithCourtTypeId(CourtTypeId)
            .WithName("Sân 1")
            .Build();

        var calculatedSlots = new List<CalculatedSlotItem>
        {
            new(CourtId, new TimeOnly(8, 0), new TimeOnly(9, 0), 100_000m, new DateOnly(2026, 11, 20))
        };

        var flatSlots = new List<FlatSlotItem>
        {
            new(CourtTypeId, PriceTableId, CourtId, new DateOnly(2026, 11, 20), new TimeOnly(8, 0), new TimeOnly(9, 0))
        };

        var serviceBranches = new List<ServiceBranch>();
        if (withService)
        {
            serviceBranches.Add(new ServiceBranch
            {
                BranchId = BranchId,
                ServiceId = ServiceId,
                Price = 15_000m,
                IsActive = true
            });
        }

        return new BookingValidationContext(branch, [court], calculatedSlots, serviceBranches, flatSlots);
    }
}
