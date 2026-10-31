using CourtBooking.Application.Features.V1.Courts.Commands.CreateCourt;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.Courts;

public sealed class CreateCourtValidatorTests
{
    private readonly CreateCourtValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldNotHaveAnyErrors()
    {
        var command = new CreateCourtCommand(Guid.NewGuid(), "Sân 1");
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WhenCourtTypeIdIsEmpty_ShouldHaveError()
    {
        var command = new CreateCourtCommand(Guid.Empty, "Sân 1");
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.CourtTypeId);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WhenNameIsEmpty_ShouldHaveError(string? name)
    {
        var command = new CreateCourtCommand(Guid.NewGuid(), name!);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }
}
