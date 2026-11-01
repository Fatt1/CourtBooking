using CourtBooking.Application.Features.V1.Pricing.Queries.GetPricingConfigByCourtType;

namespace Application.UnitTests.Features.Pricing;

public sealed class GetPricingConfigByCourtTypeValidatorTests
{
    private readonly GetPricingConfigByCourtTypeValidator _validator = new();

    [Fact]
    public void Validate_WhenValidQuery_PassesValidation()
    {
        // Arrange
        var query = new GetPricingConfigByCourtTypeQuery(Guid.CreateVersion7(), Guid.CreateVersion7());

        // Act
        var result = _validator.Validate(query);

        // Assert
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void Validate_WhenBranchIdIsEmpty_ReturnsValidationError()
    {
        // Arrange
        var query = new GetPricingConfigByCourtTypeQuery(Guid.Empty, Guid.CreateVersion7());

        // Act
        var result = _validator.Validate(query);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(GetPricingConfigByCourtTypeQuery.BranchId));
    }

    [Fact]
    public void Validate_WhenCourtTypeIdIsEmpty_ReturnsValidationError()
    {
        // Arrange
        var query = new GetPricingConfigByCourtTypeQuery(Guid.CreateVersion7(), Guid.Empty);

        // Act
        var result = _validator.Validate(query);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(GetPricingConfigByCourtTypeQuery.CourtTypeId));
    }
}
