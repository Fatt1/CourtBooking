using CourtBooking.Application.Features.V1.Pricing.Commands.FixedTimeBlocks.UpdateFixedTimeBlock;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.Pricing;

public class UpdateFixedTimeBlockValidatorTests
{
    private readonly UpdateFixedTimeBlockValidator _validator = new();

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldNotHaveAnyErrors()
    {
        // Arrange
        var command = new UpdateFixedTimeBlockCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            new TimeOnly(17, 30),
            new TimeOnly(19, 30),
            [0, 6],
            [Guid.CreateVersion7(), Guid.CreateVersion7()]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WhenBranchIdIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new UpdateFixedTimeBlockCommand(
            Guid.Empty,
            Guid.CreateVersion7(),
            new TimeOnly(17, 30),
            new TimeOnly(19, 30),
            [0, 6],
            [Guid.CreateVersion7()]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.BranchId)
            .WithErrorMessage("BranchId không được để trống.");
    }

    [Fact]
    public void Validate_WhenBlockIdIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new UpdateFixedTimeBlockCommand(
            Guid.CreateVersion7(),
            Guid.Empty,
            new TimeOnly(17, 30),
            new TimeOnly(19, 30),
            [0, 6],
            [Guid.CreateVersion7()]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.BlockId)
            .WithErrorMessage("BlockId không được để trống.");
    }

    [Fact]
    public void Validate_WhenEndTimeIsLessThanOrEqualToStartTime_ShouldHaveValidationError()
    {
        // Arrange
        var command = new UpdateFixedTimeBlockCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            new TimeOnly(19, 30),
            new TimeOnly(17, 30),
            [0, 6],
            [Guid.CreateVersion7()]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.EndTime)
            .WithErrorMessage("Giờ kết thúc phải lớn hơn giờ bắt đầu.");
    }

    [Fact]
    public void Validate_WhenDaysOfWeekIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new UpdateFixedTimeBlockCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            new TimeOnly(17, 30),
            new TimeOnly(19, 30),
            [],
            [Guid.CreateVersion7()]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.DaysOfWeek)
            .WithErrorMessage("Phải chọn ít nhất một thứ trong tuần.");
    }

    [Fact]
    public void Validate_WhenDaysOfWeekHasDuplicates_ShouldHaveValidationError()
    {
        // Arrange
        var command = new UpdateFixedTimeBlockCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            new TimeOnly(17, 30),
            new TimeOnly(19, 30),
            [1, 2, 1],
            [Guid.CreateVersion7()]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.DaysOfWeek)
            .WithErrorMessage("Danh sách thứ trong tuần không được có phần tử trùng lặp.");
    }

    [Theory]
    [InlineData(7)]
    [InlineData(-1)]
    public void Validate_WhenDayOfWeekIsOutOfRange_ShouldHaveValidationError(int invalidDay)
    {
        // Arrange
        var command = new UpdateFixedTimeBlockCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            new TimeOnly(17, 30),
            new TimeOnly(19, 30),
            [invalidDay],
            [Guid.CreateVersion7()]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.DaysOfWeek)
            .WithErrorMessage("Thứ trong tuần phải nằm trong khoảng 0 (Chủ nhật) đến 6 (Thứ bảy).");
    }

    [Fact]
    public void Validate_WhenCourtIdsIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new UpdateFixedTimeBlockCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            new TimeOnly(17, 30),
            new TimeOnly(19, 30),
            [0, 6],
            []);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.CourtIds)
            .WithErrorMessage("Phải chọn ít nhất một sân áp dụng khung giờ này.");
    }

    [Fact]
    public void Validate_WhenCourtIdsHasDuplicates_ShouldHaveValidationError()
    {
        // Arrange
        var courtId = Guid.CreateVersion7();
        var command = new UpdateFixedTimeBlockCommand(
            Guid.CreateVersion7(),
            Guid.CreateVersion7(),
            new TimeOnly(17, 30),
            new TimeOnly(19, 30),
            [0, 6],
            [courtId, courtId]);

        // Act
        var result = _validator.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.CourtIds)
            .WithErrorMessage("Danh sách sân áp dụng không được có phần tử trùng lặp.");
    }
}
