using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.CreatePriceTableRule;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.Pricing;

public class CreatePriceTableRuleValidatorTests
{
    private readonly CreatePriceTableRuleValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldNotHaveAnyErrors()
    {
        // Arrange
        var command = new CreatePriceTableRuleCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            DateOnly.FromDateTime(DateTime.UtcNow),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            1,
            5,
            new TimeOnly(6, 0),
            new TimeOnly(17, 0),
            80000m,
            100000m);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WhenBranchIdIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new CreatePriceTableRuleCommand(
            Guid.Empty,
            Guid.CreateVersion7(),
            null,
            null,
            0,
            6,
            new TimeOnly(6, 0),
            new TimeOnly(8, 0),
            80000m,
            100000m);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.BranchId)
            .WithErrorMessage("BranchId không được để trống.");
    }

    [Fact]
    public void Validate_WhenPriceTableIdIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new CreatePriceTableRuleCommand(
            Guid.CreateVersion7(),
            Guid.Empty,
            null,
            null,
            0,
            6,
            new TimeOnly(6, 0),
            new TimeOnly(8, 0),
            80000m,
            100000m);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.PriceTableId)
            .WithErrorMessage("PriceTableId không được để trống.");
    }

    [Theory]
    [InlineData(7)]
    [InlineData(255)]
    public void Validate_WhenDayOfWeekFromIsOutOfRange_ShouldHaveValidationError(byte invalidDay)
    {
        // Arrange
        var command = new CreatePriceTableRuleCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            null,
            null,
            invalidDay,
            5,
            new TimeOnly(6, 0),
            new TimeOnly(8, 0),
            80000m,
            100000m);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.DayOfWeekFrom)
            .WithErrorMessage("Thứ bắt đầu (DayOfWeekFrom) phải từ 0 (Chủ nhật) đến 6 (Thứ bảy).");
    }

    [Theory]
    [InlineData(7)]
    [InlineData(255)]
    public void Validate_WhenDayOfWeekToIsOutOfRange_ShouldHaveValidationError(byte invalidDay)
    {
        // Arrange
        var command = new CreatePriceTableRuleCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            null,
            null,
            1,
            invalidDay,
            new TimeOnly(6, 0),
            new TimeOnly(8, 0),
            80000m,
            100000m);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.DayOfWeekTo)
            .WithErrorMessage("Thứ kết thúc (DayOfWeekTo) phải từ 0 (Chủ nhật) đến 6 (Thứ bảy).");
    }

    [Fact]
    public void Validate_WhenEndTimeIsLessThanOrEqualToStartTime_ShouldHaveValidationError()
    {
        // Arrange
        var command = new CreatePriceTableRuleCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            null,
            null,
            1,
            5,
            new TimeOnly(17, 0),
            new TimeOnly(16, 0),
            80000m,
            100000m);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.EndTime)
            .WithErrorMessage("Giờ kết thúc phải lớn hơn giờ bắt đầu.");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10000)]
    public void Validate_WhenFixedCustomerPriceIsZeroOrNegative_ShouldHaveValidationError(decimal price)
    {
        // Arrange
        var command = new CreatePriceTableRuleCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            null,
            null,
            1,
            5,
            new TimeOnly(6, 0),
            new TimeOnly(8, 0),
            price,
            100000m);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.FixedCustomerPrice)
            .WithErrorMessage("Đơn giá khách cố định phải lớn hơn 0.");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10000)]
    public void Validate_WhenWalkInCustomerPriceIsZeroOrNegative_ShouldHaveValidationError(decimal price)
    {
        // Arrange
        var command = new CreatePriceTableRuleCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            null,
            null,
            1,
            5,
            new TimeOnly(6, 0),
            new TimeOnly(8, 0),
            80000m,
            price);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.WalkInCustomerPrice)
            .WithErrorMessage("Đơn giá khách vãng lai phải lớn hơn 0.");
    }

    [Fact]
    public void Validate_WhenEndDateIsBeforeStartDate_ShouldHaveValidationError()
    {
        // Arrange
        var command = new CreatePriceTableRuleCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            new DateOnly(2026, 6, 1),
            new DateOnly(2026, 5, 1),
            1,
            5,
            new TimeOnly(6, 0),
            new TimeOnly(8, 0),
            80000m,
            100000m);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.EndDate!.Value)
            .WithErrorMessage("Ngày kết thúc hiệu lực phải sau hoặc cùng ngày với ngày bắt đầu.");
    }
}
