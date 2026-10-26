using Application.UnitTests.Abstractions;
using AsyncKeyedLock;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Orders.Commands.CreateOrderOnline;
using CourtBooking.Application.Features.V1.Orders.Common;
using CourtBooking.Application.Features.V1.Orders.SharedInputs;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Orders;

public sealed class CreateOrderOnlineCommandHandlerTests : BaseHandlerTest
{
    private static readonly Guid PlayerId = Guid.NewGuid();
    private static readonly Guid BranchId = Guid.NewGuid();
    private static readonly Guid CourtId = Guid.NewGuid();
    private static readonly Guid CourtTypeId = Guid.NewGuid();
    private static readonly Guid PriceTableId = Guid.NewGuid();
    private static readonly Guid ServiceId = Guid.NewGuid();

    [Fact]
    public async Task Handle_Should_ReturnFailure_WhenValidationFails()
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
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(error);
    }

    [Fact]
    public async Task Handle_Should_ReturnConflict_WhenCheckConflictsFails()
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
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(conflictError);
    }

    [Fact]
    public async Task Handle_Should_ReturnForbidden_WhenPlayerNotAuthenticated()
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
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ForbiddenError>();
    }

    [Fact]
    public async Task Handle_Should_CreateOrderSuccessfully_WhenValidRequest()
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
        result.IsSuccess.ShouldBeTrue();
        result.Value.OrderId.ShouldNotBe(Guid.Empty);
        result.Value.OrderCode.ShouldStartWith("ORD-");
        result.Value.TotalAmount.ShouldBe(100_000m);
        result.Value.AccountNumber.ShouldBe("123456789");
        result.Value.AccountName.ShouldBe("NGUYEN VAN A");
        result.Value.QrCodeImageKey.ShouldBe("branches/qr/branch1.png");

        Order savedOrder = await context.Orders
            .Include(o => o.Details)
            .SingleAsync(o => o.Id == result.Value.OrderId);

        savedOrder.BranchId.ShouldBe(BranchId);
        savedOrder.PlayerId.ShouldBe(PlayerId);
        savedOrder.CustomerName.ShouldBe("Nguyen Van B");
        savedOrder.CustomerPhone.ShouldBe("0901234567");
        savedOrder.Status.ShouldBe(OrderStatus.AwaitingPayment);
        savedOrder.Channel.ShouldBe(OrderChannel.Online);
        savedOrder.TotalCourtAmount.ShouldBe(100_000m);
        savedOrder.Details.Count.ShouldBe(1);
        savedOrder.Details[0].CourtId.ShouldBe(CourtId);
        savedOrder.Details[0].Price.ShouldBe(100_000m);
    }

    [Fact]
    public async Task Handle_Should_CreateOrderWithServicesSuccessfully_WhenServicesIncluded()
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
        result.IsSuccess.ShouldBeTrue();
        Order savedOrder = await context.Orders
            .Include(o => o.Services)
            .SingleAsync(o => o.Id == result.Value.OrderId);

        savedOrder.Services.Count.ShouldBe(1);
        savedOrder.Services[0].ServiceId.ShouldBe(ServiceId);
        savedOrder.Services[0].UnitPrice.ShouldBe(15_000m);
        savedOrder.Services[0].Quantity.ShouldBe(2);
        savedOrder.TotalServiceAmount.ShouldBe(30_000m);
        savedOrder.TotalAmount.ShouldBe(130_000m);
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
        var branch = new Branch
        {
            Id = BranchId,
            Name = "Chi nhánh Tân Bình",
            Hotline = "0900000000",
            Province = "TP.HCM",
            District = "Tân Bình",
            Street = "123 Cộng Hòa",
            AccountNumber = "123456789",
            AccountName = "NGUYEN VAN A",
            IsActive = true,
            QrImage = new Image
            {
                Id = Guid.NewGuid(),
                StorageKey = "branches/qr/branch1.png",
                StorageProvider = StorageProvider.S3,
                Status = ImageStatus.Attached
            }
        };

        var court = new Court
        {
            Id = CourtId,
            CourtTypeId = CourtTypeId,
            Name = "Sân 1",
            Status = CourtStatus.Available
        };

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
