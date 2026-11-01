using CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.DeleteFixedTimeBlock;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.Pricing;

public class DeleteFixedTimeBlockValidatorTests
{
    private readonly DeleteFixedTimeBlockValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldNotHaveAnyErrors()
    {
        // Arrange
        var command = new DeleteFixedTimeBlockCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7());

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WhenBranchIdIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new DeleteFixedTimeBlockCommand(
            Guid.Empty,
            Guid.CreateVersion7());

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.BranchId)
            .WithErrorMessage("BranchId không được để trống.");
    }

    [Fact]
    public void Validate_WhenBlockIdIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new DeleteFixedTimeBlockCommand(
            Guid.CreateVersion7(),
            Guid.Empty);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.BlockId)
            .WithErrorMessage("BlockId không được để trống.");
    }
}
