using CourtBooking.Application.Features.V1.CourtTypes.Commands.UpdateCourtType;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.CourtTypes;

public sealed class UpdateCourtTypeValidatorTests
{
    private readonly UpdateCourtTypeValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldNotHaveAnyErrors()
    {
        var command = new UpdateCourtTypeCommand(Guid.NewGuid(), "Sân VIP 2", 90);
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WhenIdIsEmpty_ShouldHaveError()
    {
        var command = new UpdateCourtTypeCommand(Guid.Empty, "Sân VIP 2", 90);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Id);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WhenNameIsEmpty_ShouldHaveError(string? name)
    {
        var command = new UpdateCourtTypeCommand(Guid.NewGuid(), name!, 90);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Theory]
    [InlineData(45)]
    [InlineData(0)]
    public void Validate_WhenMinutesConfigIsInvalid_ShouldHaveError(int minutes)
    {
        var command = new UpdateCourtTypeCommand(Guid.NewGuid(), "Sân VIP 2", minutes);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.MinutesConfig);
    }
}
