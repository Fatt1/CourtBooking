using CourtBooking.Application.Features.V1.ServiceCategories.Commands.CreateServiceCategory;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.ServiceCategories;

public sealed class CreateServiceCategoryValidatorTests
{
    private readonly CreateServiceCategoryValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_HasNoValidationErrors()
    {
        // Arrange
        var command = new CreateServiceCategoryCommand(
            Name: "Nước uống & Giải khát",
            Description: "Các loại nước đóng chai",
            IsActive: true);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WhenNameIsEmpty_HasValidationError(string? invalidName)
    {
        // Arrange
        var command = new CreateServiceCategoryCommand(
            Name: invalidName!,
            Description: "Mô tả",
            IsActive: true);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name)
            .WithErrorMessage("Tên loại dịch vụ không được để trống.");
    }

    [Fact]
    public void Validate_WhenNameExceeds150Chars_HasValidationError()
    {
        // Arrange
        var longName = new string('C', 151);
        var command = new CreateServiceCategoryCommand(
            Name: longName,
            Description: "Mô tả",
            IsActive: true);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name)
            .WithErrorMessage("Tên loại dịch vụ không được vượt quá 150 ký tự.");
    }

    [Fact]
    public void Validate_WhenDescriptionExceeds300Chars_HasValidationError()
    {
        // Arrange
        var longDescription = new string('D', 301);
        var command = new CreateServiceCategoryCommand(
            Name: "Thuê phụ kiện",
            Description: longDescription,
            IsActive: true);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Description)
            .WithErrorMessage("Mô tả không được vượt quá 300 ký tự.");
    }
}
