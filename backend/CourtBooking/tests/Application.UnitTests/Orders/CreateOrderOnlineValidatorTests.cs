using CourtBooking.Application.Features.V1.Orders.Commands.CreateOrderOnline;
using CourtBooking.Application.Features.V1.Orders.SharedInputs;

namespace Application.UnitTests.Orders;

public sealed class CreateOrderOnlineValidatorTests
{
    private readonly CreateOrderOnlineValidator _validator = new();

    private static readonly Guid ValidBranchId = Guid.NewGuid();
    private static readonly Guid ValidCourtTypeId = Guid.NewGuid();
    private static readonly Guid ValidPriceTableId = Guid.NewGuid();
    private static readonly Guid ValidCourtId = Guid.NewGuid();
    private static readonly Guid ValidServiceId = Guid.NewGuid();

    [Fact]
    public void Validate_Should_Pass_WhenCommandIsValid()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeTrue();
        result.Errors.ShouldBeEmpty();
    }

    [Fact]
    public void Validate_Should_Fail_WhenBranchIdIsEmpty()
    {
        // Arrange
        var command = CreateValidCommand() with { BranchId = Guid.Empty };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CreateOrderOnlineCommand.BranchId));
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Validate_Should_Fail_WhenCustomerNameIsWhitespaceOrEmpty(string invalidName)
    {
        // Arrange
        var command = CreateValidCommand() with { CustomerName = invalidName };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CreateOrderOnlineCommand.CustomerName));
    }

    [Theory]
    [InlineData("12345")]
    [InlineData("090123")]
    [InlineData("abcdefghij")]
    [InlineData("1901234567")]
    public void Validate_Should_Fail_WhenCustomerPhoneIsInvalid(string invalidPhone)
    {
        // Arrange
        var command = CreateValidCommand() with { CustomerPhone = invalidPhone };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CreateOrderOnlineCommand.CustomerPhone));
    }

    [Fact]
    public void Validate_Should_Fail_WhenCourtSlotsIsEmpty()
    {
        // Arrange
        var command = CreateValidCommand() with { CourtSlots = [] };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CreateOrderOnlineCommand.CourtSlots));
    }

    [Fact]
    public void Validate_Should_Fail_WhenDateIsInThePast()
    {
        // Arrange
        var pastDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2));
        var slots = new List<CourtBookingSlot>
        {
            new(
                ValidCourtTypeId,
                ValidPriceTableId,
                [new CourtSlotItem(ValidCourtId, pastDate, new TimeOnly(8, 0), new TimeOnly(9, 0))]
            )
        };
        var command = CreateValidCommand() with { CourtSlots = slots };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.ErrorMessage.Contains("quá khứ"));
    }

    [Fact]
    public void Validate_Should_Fail_WhenEndTimeIsNotAfterStartTime()
    {
        // Arrange
        var futureDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1));
        var slots = new List<CourtBookingSlot>
        {
            new(
                ValidCourtTypeId,
                ValidPriceTableId,
                [new CourtSlotItem(ValidCourtId, futureDate, new TimeOnly(10, 0), new TimeOnly(9, 0))]
            )
        };
        var command = CreateValidCommand() with { CourtSlots = slots };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.ErrorMessage.Contains("Giờ kết thúc phải sau giờ bắt đầu"));
    }

    [Fact]
    public void Validate_Should_Fail_WhenDuplicateServicesProvided()
    {
        // Arrange
        var duplicateServices = new List<OrderServiceItem>
        {
            new(ValidServiceId, 1),
            new(ValidServiceId, 2)
        };
        var command = CreateValidCommand() with { Services = duplicateServices };

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.ErrorMessage.Contains("trùng lặp dịch vụ"));
    }

    private static CreateOrderOnlineCommand CreateValidCommand()
    {
        var futureDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2));
        var courtSlots = new List<CourtBookingSlot>
        {
            new(
                ValidCourtTypeId,
                ValidPriceTableId,
                [new CourtSlotItem(ValidCourtId, futureDate, new TimeOnly(8, 0), new TimeOnly(9, 0))]
            )
        };

        return new CreateOrderOnlineCommand(
            ValidBranchId,
            "Nguyen Van A",
            "0901234567",
            "Ghi chu hop le",
            courtSlots,
            [new OrderServiceItem(ValidServiceId, 2)],
            Guid.NewGuid());
    }
}
