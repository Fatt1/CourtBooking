using CourtBooking.Application.Features.V1.SportTypes.Commands.UpdateSportType;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.SportTypes;

public sealed class UpdateSportTypeValidatorTests
{
    private readonly UpdateSportTypeValidator _validator = new();

    private static UpdateSportTypeCommand CreateValidCommand() =>
        new(Guid.NewGuid(), "Bóng chuyền", Guid.NewGuid());

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldNotHaveAnyErrors()
    {
        // Arrange
        var command = CreateValidCommand();

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WhenNameIsEmpty_ShouldHaveValidationError(string? name)
    {
        // Arrange
        var command = CreateValidCommand() with { Name = name! };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Validate_WhenNameExceeds100Characters_ShouldHaveValidationError()
    {
        // Arrange
        var longName = new string('B', 101);
        var command = CreateValidCommand() with { Name = longName };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }
}
