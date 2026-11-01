using CourtBooking.Application.Features.V1.Pricing.Queries.GetPricingConfigByBranchId;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.Pricing;

public class GetPricingConfigByBranchIdValidatorTests
{
    private readonly GetPricingConfigByBranchIdValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldNotHaveAnyErrors()
    {
        // Arrange
        var query = new GetPricingConfigByBranchIdQuery(Guid.CreateVersion7());

        // Act
        var result = _validator.TestValidate(query);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WhenBranchIdIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var query = new GetPricingConfigByBranchIdQuery(Guid.Empty);

        // Act
        var result = _validator.TestValidate(query);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.BranchId)
            .WithErrorMessage("BranchId không được để trống.");
    }
}
