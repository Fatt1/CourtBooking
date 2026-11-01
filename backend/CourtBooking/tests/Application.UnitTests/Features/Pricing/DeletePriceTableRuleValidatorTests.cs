using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.DeletePriceTableRule;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.Pricing;

public class DeletePriceTableRuleValidatorTests
{
    private readonly DeletePriceTableRuleValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldNotHaveAnyErrors()
    {
        // Arrange
        var command = new DeletePriceTableRuleCommand(
            Guid.CreateVersion7(),
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
        var command = new DeletePriceTableRuleCommand(
            Guid.Empty,
            Guid.CreateVersion7(),
            Guid.CreateVersion7());

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
        var command = new DeletePriceTableRuleCommand(
            Guid.CreateVersion7(),
            Guid.Empty,
            Guid.CreateVersion7());

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.PriceTableId)
            .WithErrorMessage("PriceTableId không được để trống.");
    }

    [Fact]
    public void Validate_WhenRuleIdIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new DeletePriceTableRuleCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            Guid.Empty);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.RuleId)
            .WithErrorMessage("RuleId không được để trống.");
    }
}
