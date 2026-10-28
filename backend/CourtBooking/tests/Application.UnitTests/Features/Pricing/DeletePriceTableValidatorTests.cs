using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.DeletePriceTable;

namespace Application.UnitTests.Features.Pricing;

public sealed class DeletePriceTableValidatorTests
{
    private readonly DeletePriceTableValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_PassesValidation()
    {
        // Arrange
        var command = new DeletePriceTableCommand(Guid.CreateVersion7(), Guid.CreateVersion7());

        // Act
        var result = _validator.Validate(command);

        // Assert
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void Validate_WhenBranchIdIsEmpty_ReturnsValidationError()
    {
        // Arrange
        var command = new DeletePriceTableCommand(Guid.Empty, Guid.CreateVersion7());

        // Act
        var result = _validator.Validate(command);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(DeletePriceTableCommand.BranchId));
    }

    [Fact]
    public void Validate_WhenPriceTableIdIsEmpty_ReturnsValidationError()
    {
        // Arrange
        var command = new DeletePriceTableCommand(Guid.CreateVersion7(), Guid.Empty);

        // Act
        var result = _validator.Validate(command);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(DeletePriceTableCommand.PriceTableId));
    }
}
