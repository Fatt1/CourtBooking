using CourtBooking.Application.Features.V1.SportTypes.Commands.CreateSportType;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.SportTypes;

public sealed class CreateSportTypeValidatorTests
{
    private readonly CreateSportTypeValidator _validator = new();

    private static CreateSportTypeCommand CreateValidCommand() =>
        new("Cầu lông", Guid.NewGuid());

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
        var longName = new string('A', 101);
        var command = CreateValidCommand() with { Name = longName };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Validate_WhenImageIdIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = CreateValidCommand() with { ImageId = Guid.Empty };

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.ImageId);
    }
}
