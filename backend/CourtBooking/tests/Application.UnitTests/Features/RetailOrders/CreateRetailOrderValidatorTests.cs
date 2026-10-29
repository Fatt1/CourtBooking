using CourtBooking.Application.Features.V1.RetailOrders.Commands.CreateRetailOrder;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.RetailOrders;

public sealed class CreateRetailOrderValidatorTests
{
    private readonly CreateRetailOrderValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_HasNoValidationErrors()
    {
        // Arrange
        var command = new CreateRetailOrderCommand(
            BranchId: Guid.NewGuid(),
            DiscountAmount: 5_000m,
            Items: [
                new CreateRetailOrderItem(Guid.NewGuid(), 2),
                new CreateRetailOrderItem(Guid.NewGuid(), 1)
            ]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WhenBranchIdIsEmpty_HasValidationError()
    {
        // Arrange
        var command = new CreateRetailOrderCommand(
            BranchId: Guid.Empty,
            DiscountAmount: 0m,
            Items: [new CreateRetailOrderItem(Guid.NewGuid(), 1)]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.BranchId);
    }

    [Fact]
    public void Validate_WhenDiscountAmountIsNegative_HasValidationError()
    {
        // Arrange
        var command = new CreateRetailOrderCommand(
            BranchId: Guid.NewGuid(),
            DiscountAmount: -100m,
            Items: [new CreateRetailOrderItem(Guid.NewGuid(), 1)]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.DiscountAmount);
    }

    [Fact]
    public void Validate_WhenItemsListIsEmpty_HasValidationError()
    {
        // Arrange
        var command = new CreateRetailOrderCommand(
            BranchId: Guid.NewGuid(),
            DiscountAmount: 0m,
            Items: []);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Items);
    }

    [Fact]
    public void Validate_WhenDuplicateServicesInItems_HasValidationError()
    {
        // Arrange
        var duplicatedServiceId = Guid.NewGuid();
        var command = new CreateRetailOrderCommand(
            BranchId: Guid.NewGuid(),
            DiscountAmount: 0m,
            Items: [
                new CreateRetailOrderItem(duplicatedServiceId, 1),
                new CreateRetailOrderItem(duplicatedServiceId, 2)
            ]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Items)
            .WithErrorMessage("Mỗi dịch vụ chỉ được xuất hiện một lần trong đơn hàng.");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(10000)]
    public void Validate_WhenItemQuantityIsOutOfRange_HasValidationError(int invalidQuantity)
    {
        // Arrange
        var command = new CreateRetailOrderCommand(
            BranchId: Guid.NewGuid(),
            DiscountAmount: 0m,
            Items: [new CreateRetailOrderItem(Guid.NewGuid(), invalidQuantity)]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor("Items[0].Quantity");
    }

    [Fact]
    public void Validate_WhenItemServiceIdIsEmpty_HasValidationError()
    {
        // Arrange
        var command = new CreateRetailOrderCommand(
            BranchId: Guid.NewGuid(),
            DiscountAmount: 0m,
            Items: [new CreateRetailOrderItem(Guid.Empty, 1)]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor("Items[0].ServiceId");
    }
}
