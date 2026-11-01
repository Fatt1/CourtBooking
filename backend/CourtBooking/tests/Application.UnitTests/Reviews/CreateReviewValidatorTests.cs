using CourtBooking.Application.Features.V1.Reviews.Commands.CreateReview;

namespace Application.UnitTests.Reviews;

public sealed class CreateReviewValidatorTests
{
    private readonly CreateReviewValidator _validator = new();

    [Fact]
    public void Validate_WhenOrderIdIsEmpty_ShouldHaveValidationError()
    {
        // Arrange
        var command = new CreateReviewCommand(Guid.Empty, 5, "Sân rất đẹp");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CreateReviewCommand.OrderId));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(255)]
    public void Validate_WhenRatingIsOutOfRange_ShouldHaveValidationError(byte invalidRating)
    {
        // Arrange
        var command = new CreateReviewCommand(Guid.NewGuid(), invalidRating, "Bình luận");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CreateReviewCommand.Rating));
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public void Validate_WhenRatingIsValid_ShouldNotHaveRatingValidationError(byte validRating)
    {
        // Arrange
        var command = new CreateReviewCommand(Guid.NewGuid(), validRating, "Bình luận tốt");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.Errors.ShouldNotContain(e => e.PropertyName == nameof(CreateReviewCommand.Rating));
    }

    [Fact]
    public void Validate_WhenCommentExceeds1000Characters_ShouldHaveValidationError()
    {
        // Arrange
        var longComment = new string('a', 1001);
        var command = new CreateReviewCommand(Guid.NewGuid(), 5, longComment);

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeFalse();
        result.Errors.ShouldContain(e => e.PropertyName == nameof(CreateReviewCommand.Comment));
    }

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldPassValidation()
    {
        // Arrange
        var command = new CreateReviewCommand(Guid.NewGuid(), 5, "Sân sạch đẹp, nhân viên nhiệt tình!");

        // Act
        var result = _validator.Validate(command);

        // Assert
        result.IsValid.ShouldBeTrue();
        result.Errors.ShouldBeEmpty();
    }
}

