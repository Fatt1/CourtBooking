using FluentValidation;

namespace CourtBooking.Application.Features.V1.Branches.Commands.CreateBranch;

public sealed class CreateBranchValidator : AbstractValidator<CreateBranchCommand>
{
    public CreateBranchValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Hotline).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Province).NotEmpty().MaximumLength(100);
        RuleFor(x => x.District).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Street).NotEmpty().MaximumLength(255);
        RuleFor(x => x.AccountNumber).NotEmpty().MaximumLength(255);
        RuleFor(x => x.AccountName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.BankName).MaximumLength(255);
        RuleFor(x => x.BankCode).MaximumLength(50);
        RuleFor(x => x.Policy).MaximumLength(4000);
        RuleFor(x => x.QrImageId).NotEmpty();
        RuleFor(x => x.CloseTime).NotEqual(x => x.OpenTime)
            .WithMessage("Giờ đóng cửa phải khác giờ mở cửa.");
        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90m, 90m)
            .WithMessage("Vĩ độ (Latitude) phải nằm trong khoảng từ -90 đến 90 độ.");
        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180m, 180m)
            .WithMessage("Kinh độ (Longitude) phải nằm trong khoảng từ -180 đến 180 độ.");
        RuleFor(x => x.MapUrl).MaximumLength(1000);
        RuleFor(x => x.SportTypeIds).NotNull().Must(x => x is { Count: > 0 })
            .WithMessage("Chi nhánh phải có ít nhất một môn thể thao.");
        RuleFor(x => x.SportTypeIds).Must(x => x is null ||
            (x.All(id => id != Guid.Empty) && x.Distinct().Count() == x.Count))
            .WithMessage("Danh sách môn thể thao có ID rỗng hoặc trùng.");
        RuleFor(x => x.ImageIds).Must(x => x is null ||
            (x.All(id => id != Guid.Empty) && x.Distinct().Count() == x.Count))
            .WithMessage("Danh sách ảnh có ID rỗng hoặc trùng.");
    }
}
