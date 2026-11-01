using CourtBooking.Application.Features.V1.Services.Commands.CreateService;
using CourtBooking.Application.Features.V1.Services.Dtos;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.Services;

public sealed class CreateServiceValidatorTests
{
    private readonly CreateServiceValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_HasNoValidationErrors()
    {
        // Arrange
        var command = new CreateServiceCommand(
            CategoryId: Guid.NewGuid(),
            Name: "Nước tăng lực",
            Unit: "Lon",
            ImageId: null,
            Branches: [new ServiceBranchItemDto(Guid.NewGuid(), 15_000m, true)]);

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
        var command = new CreateServiceCommand(
            CategoryId: Guid.NewGuid(),
            Name: invalidName!,
            Unit: "Chai",
            ImageId: null,
            Branches: [new ServiceBranchItemDto(Guid.NewGuid(), 10_000m, true)]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Validate_WhenNameExceedsMaxLength_HasValidationError()
    {
        // Arrange
        var longName = new string('A', 256);
        var command = new CreateServiceCommand(
            CategoryId: Guid.NewGuid(),
            Name: longName,
            Unit: "Chai",
            ImageId: null,
            Branches: [new ServiceBranchItemDto(Guid.NewGuid(), 10_000m, true)]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_WhenUnitIsEmpty_HasValidationError(string? invalidUnit)
    {
        // Arrange
        var command = new CreateServiceCommand(
            CategoryId: Guid.NewGuid(),
            Name: "Khăn lạnh",
            Unit: invalidUnit!,
            ImageId: null,
            Branches: [new ServiceBranchItemDto(Guid.NewGuid(), 5_000m, true)]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Unit);
    }

    [Fact]
    public void Validate_WhenBranchesEmpty_HasValidationError()
    {
        // Arrange
        var command = new CreateServiceCommand(
            CategoryId: Guid.NewGuid(),
            Name: "Khăn lạnh",
            Unit: "Cái",
            ImageId: null,
            Branches: []);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Branches);
    }

    [Fact]
    public void Validate_WhenDuplicateBranches_HasValidationError()
    {
        // Arrange
        var branchId = Guid.NewGuid();
        var command = new CreateServiceCommand(
            CategoryId: Guid.NewGuid(),
            Name: "Khăn lạnh",
            Unit: "Cái",
            ImageId: null,
            Branches: [
                new ServiceBranchItemDto(branchId, 5_000m, true),
                new ServiceBranchItemDto(branchId, 6_000m, true)
            ]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Branches)
            .WithErrorMessage("Danh sách chi nhánh không được chứa BranchId trùng nhau.");
    }

    [Fact]
    public void Validate_WhenBranchPriceIsNegative_HasValidationError()
    {
        // Arrange
        var command = new CreateServiceCommand(
            CategoryId: Guid.NewGuid(),
            Name: "Khăn lạnh",
            Unit: "Cái",
            ImageId: null,
            Branches: [new ServiceBranchItemDto(Guid.NewGuid(), -1_000m, true)]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor("Branches[0].Price");
    }
}
