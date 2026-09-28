using FluentValidation;

namespace CourtBooking.Application.Features.V1.Storages.Commands.UploadImage;

public sealed class UploadImageValidator : AbstractValidator<UploadImageCommand>
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    private const long MaxFileSizeInBytes = 10 * 1024 * 1024; // 10MB

    public UploadImageValidator()
    {
        RuleFor(x => x.FileStream)
            .NotNull()
            .WithMessage("File stream cannot be null.");

        RuleFor(x => x.SizeBytes)
            .GreaterThan(0)
            .WithMessage("Please upload a valid image file.")
            .LessThanOrEqualTo(MaxFileSizeInBytes)
            .WithMessage("Image file must not exceed 10MB.");

        RuleFor(x => x.FileName)
            .NotEmpty()
            .WithMessage("File name is required.")
            .Must(HaveAllowedExtension)
            .WithMessage($"Allowed image types: {string.Join(", ", AllowedExtensions)}");

        RuleFor(x => x.ContentType)
            .NotEmpty()
            .WithMessage("Content type is required.")
            .Must(ct => !string.IsNullOrWhiteSpace(ct) && ct.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            .WithMessage("The uploaded file is not recognized as an image.");
    }

    private static bool HaveAllowedExtension(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return false;
        }

        var extension = Path.GetExtension(fileName);
        return !string.IsNullOrEmpty(extension) && AllowedExtensions.Contains(extension);
    }
}
