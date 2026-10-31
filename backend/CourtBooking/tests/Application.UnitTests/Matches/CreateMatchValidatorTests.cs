using CourtBooking.Application.Features.V1.Matches.Commands.CreateMatch;

namespace Application.UnitTests.Matches;

public sealed class CreateMatchValidatorTests
{
    private readonly CreateMatchValidator _validator = new();

    [Fact]
    public void Validate_WhenOrderIdIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new CreateMatchCommand(
            Guid.Empty,
            "Cơ bản",
            2,
            50000m,
            0,
            "Tìm bạn giao lưu");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CreateMatchCommand.OrderId));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-10)]
    public void Validate_WhenMissingPlayersIsZeroOrNegative_ShouldHaveValidationError(int missingPlayers)
    {
        // Arrange
        var command = new CreateMatchCommand(
            Guid.NewGuid(),
            "Khá",
            missingPlayers,
            50000m,
            0,
            "Cần tuyển thêm");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CreateMatchCommand.MissingPlayers));
    }

    [Theory]
    [InlineData(-0.01)]
    [InlineData(-50000)]
    public void Validate_WhenFeePerPlayerIsNegative_ShouldHaveValidationError(decimal feePerPlayer)
    {
        // Arrange
        var command = new CreateMatchCommand(
            Guid.NewGuid(),
            "Trung bình",
            2,
            feePerPlayer,
            0,
            "Phí âm không hợp lệ");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CreateMatchCommand.FeePerPlayer));
    }

    [Theory]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(255)]
    public void Validate_WhenApprovalModeIsInvalid_ShouldHaveValidationError(byte approvalMode)
    {
        // Arrange
        var command = new CreateMatchCommand(
            Guid.NewGuid(),
            "Trung bình",
            2,
            50000m,
            approvalMode,
            "Chế độ duyệt không hợp lệ");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CreateMatchCommand.ApprovalMode));
    }

    [Fact]
    public void Validate_WhenDescriptionExceedsMaxLength_ShouldHaveValidationError()
    {
        // Arrange
        var command = new CreateMatchCommand(
            Guid.NewGuid(),
            "Chuyên nghiệp",
            2,
            50000m,
            1,
            new string('a', 501));

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CreateMatchCommand.Description));
    }

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldNotHaveValidationErrors()
    {
        // Arrange
        var command = new CreateMatchCommand(
            Guid.NewGuid(),
            "Trung bình",
            4,
            30000m,
            0,
            "Giao lưu vui vẻ, rèn luyện sức khỏe.");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeTrue();
        result.Errors.ShouldBeEmpty();
    }
}

