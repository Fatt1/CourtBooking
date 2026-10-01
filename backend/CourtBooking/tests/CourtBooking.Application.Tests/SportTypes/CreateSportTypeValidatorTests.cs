using CourtBooking.Application.Features.V1.SportTypes.Commands.CreateSportType;
using Shouldly;
using Xunit;

namespace CourtBooking.Application.Tests.SportTypes;

public sealed class CreateSportTypeValidatorTests
{
    [Fact]
    public async Task Validate_WhenNameIsEmpty_ShouldReturnValidationError()
    {
        // Arrange
        var command = new CreateSportTypeCommand(
            Name: string.Empty,
            ImageId: null);

        var validator = new CreateSportTypeValidator();

        // Act
        var result = await validator.ValidateAsync(command);

        // Assert
        result.IsValid.ShouldBeFalse();

        result.Errors.ShouldContain(error =>
            error.PropertyName == nameof(CreateSportTypeCommand.Name));
    }
    [Fact]
public async Task Validate_WhenTrimmedNameHas100Characters_ShouldBeValid()
{
    var command = new CreateSportTypeCommand(
        Name: $"  {new string('A', 100)}  ",
        ImageId: null);

    var validator = new CreateSportTypeValidator();

    var result = await validator.ValidateAsync(command);

    result.IsValid.ShouldBeTrue();
}
}