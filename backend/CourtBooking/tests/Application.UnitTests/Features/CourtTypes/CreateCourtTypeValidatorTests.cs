using CourtBooking.Application.Features.V1.CourtTypes.Commands.CreateCourtType;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.CourtTypes;

public sealed class CreateCourtTypeValidatorTests
{
    private readonly CreateCourtTypeValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldNotHaveAnyErrors()
    {
        var command = new CreateCourtTypeCommand(Guid.NewGuid(), "Sân VIP", 60);
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WhenBranchIdIsEmpty_ShouldHaveError()
    {
        var command = new CreateCourtTypeCommand(Guid.Empty, "Sân VIP", 60);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.BranchId);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WhenNameIsEmpty_ShouldHaveError(string? name)
    {
        var command = new CreateCourtTypeCommand(Guid.NewGuid(), name!, 60);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-30)]
    public void Validate_WhenMinutesConfigIsZeroOrNegative_ShouldHaveError(int minutes)
    {
        var command = new CreateCourtTypeCommand(Guid.NewGuid(), "Sân VIP", minutes);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.MinutesConfig);
    }

    [Theory]
    [InlineData(45)]
    [InlineData(70)]
    [InlineData(25)]
    public void Validate_WhenMinutesConfigIsNotMultipleOf30_ShouldHaveError(int minutes)
    {
        var command = new CreateCourtTypeCommand(Guid.NewGuid(), "Sân Cầu Lông", minutes);
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.MinutesConfig)
            .WithErrorMessage("Thời lượng mỗi lượt đặt phải là bội số của 30 phút (30, 60, 90, 120, 150,...).");
    }
}
