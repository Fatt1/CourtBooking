using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.UpdatePriceTable;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.Pricing;

public sealed class UpdatePriceTableValidatorTests
{
    private readonly UpdatePriceTableValidator _validator = new();

    private static UpdatePriceTableCommand CreateValidCommand() =>
        new(Guid.CreateVersion7(), Guid.CreateVersion7(), "Bảng giá tiêu chuẩn", 100000m, 120000m, true);

    [Fact]
    public void Validate_WhenCommandIsValid_PassesValidation()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WhenBranchIdIsEmpty_ReturnsValidationError()
    {
        // Arrange
        var command = CreateValidCommand() with { BranchId = Guid.Empty };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.BranchId)
            .WithErrorMessage("BranchId không được để trống.");
    }

    [Fact]
    public void Validate_WhenPriceTableIdIsEmpty_ReturnsValidationError()
    {
        // Arrange
        var command = CreateValidCommand() with { PriceTableId = Guid.Empty };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.PriceTableId)
            .WithErrorMessage("PriceTableId không được để trống.");
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Validate_WhenNameIsWhitespaceOrEmpty_ReturnsValidationError(string invalidName)
    {
        // Arrange
        var command = CreateValidCommand() with { Name = invalidName };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name)
            .WithErrorMessage("Tên bảng giá không được để trống.");
    }

    [Fact]
    public void Validate_WhenNameExceeds255Chars_ReturnsValidationError()
    {
        // Arrange
        var command = CreateValidCommand() with { Name = new string('A', 256) };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name)
            .WithErrorMessage("Tên bảng giá không được vượt quá 255 ký tự.");
    }

    [Fact]
    public void Validate_WhenDefaultPriceIsNegative_ReturnsValidationError()
    {
        // Arrange
        var command = CreateValidCommand() with { DefaultPrice = -1m };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.DefaultPrice)
            .WithErrorMessage("Giá mặc định không được âm.");
    }

    [Fact]
    public void Validate_WhenDefaultWalkInPriceIsNegative_ReturnsValidationError()
    {
        // Arrange
        var command = CreateValidCommand() with { DefaultWalkInPrice = -1m };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.DefaultWalkInPrice)
            .WithErrorMessage("Giá vãng lai mặc định không được âm.");
    }
}
