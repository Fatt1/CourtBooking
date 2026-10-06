using FluentValidation;

namespace CourtBooking.Application.Features.V1.Matches.Commands.CreateMatch;

public sealed class CreateMatchValidator : AbstractValidator<CreateMatchCommand>
{
    public CreateMatchValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("Mã đơn hàng không được để trống.");

        RuleFor(x => x.MissingPlayers)
            .GreaterThan(0)
            .WithMessage("Số lượng người cần tuyển phải lớn hơn 0.");

        RuleFor(x => x.FeePerPlayer)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Chi phí mỗi người không được âm.");

        RuleFor(x => x.ApprovalMode)
            .Must(m => m == 0 || m == 1)
            .WithMessage("Chế độ duyệt chỉ có thể là 0 (Tự động) hoặc 1 (Chủ phòng duyệt).");

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .WithMessage("Mô tả không được vượt quá 500 ký tự.");
    }
}
