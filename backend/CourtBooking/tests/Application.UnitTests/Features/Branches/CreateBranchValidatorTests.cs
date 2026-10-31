using CourtBooking.Application.Features.V1.Branches.Commands.CreateBranch;
using FluentValidation.TestHelper;

namespace Application.UnitTests.Features.Branches;

public sealed class CreateBranchValidatorTests
{
    private readonly CreateBranchValidator _validator = new();

    private static CreateBranchCommand CreateValidCommand() =>
        new(
            Name: "Chi nhánh Quận 1",
            Hotline: "0901234567",
            Province: "TP.HCM",
            District: "Quận 1",
            Street: "123 Lê Lợi",
            MapUrl: "https://maps.google.com/?q=10.7769,106.7009",
            OpenTime: new TimeOnly(6, 0),
            CloseTime: new TimeOnly(22, 0),
            QrImageId: Guid.NewGuid(),
            AccountNumber: "1234567890",
            AccountName: "NGUYEN VAN A",
            SportTypeIds: [Guid.NewGuid()],
            Policy: "Quy định hủy trước 24h",
            Latitude: 10.7769m,
            Longitude: 106.7009m,
            ImageIds: [Guid.NewGuid()],
            Description: "Mô tả chi nhánh",
            BankName: "Vietcombank",
            BankCode: "VCB"
        );

    [Fact]
    public void Validate_WhenCommandIsValid_ShouldNotHaveAnyErrors()
    {
        var command = CreateValidCommand();
        var result = _validator.TestValidate(command);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WhenNameIsEmpty_ShouldHaveError(string? name)
    {
        var command = CreateValidCommand() with { Name = name! };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WhenHotlineIsEmpty_ShouldHaveError(string? hotline)
    {
        var command = CreateValidCommand() with { Hotline = hotline! };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Hotline);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Validate_WhenAddressFieldsAreEmpty_ShouldHaveErrors(string? value)
    {
        var command = CreateValidCommand() with
        {
            Province = value!,
            District = value!,
            Street = value!
        };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Province);
        result.ShouldHaveValidationErrorFor(x => x.District);
        result.ShouldHaveValidationErrorFor(x => x.Street);
    }

    [Fact]
    public void Validate_WhenCloseTimeEqualsOpenTime_ShouldHaveError()
    {
        var time = new TimeOnly(8, 0);
        var command = CreateValidCommand() with { OpenTime = time, CloseTime = time };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.CloseTime);
    }

    [Theory]
    [InlineData(-91)]
    [InlineData(91)]
    public void Validate_WhenLatitudeIsOutOfRange_ShouldHaveError(decimal lat)
    {
        var command = CreateValidCommand() with { Latitude = lat };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Latitude);
    }

    [Theory]
    [InlineData(-181)]
    [InlineData(181)]
    public void Validate_WhenLongitudeIsOutOfRange_ShouldHaveError(decimal lng)
    {
        var command = CreateValidCommand() with { Longitude = lng };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Longitude);
    }

    [Fact]
    public void Validate_WhenSportTypeIdsIsEmpty_ShouldHaveError()
    {
        var command = CreateValidCommand() with { SportTypeIds = [] };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.SportTypeIds);
    }

    [Fact]
    public void Validate_WhenSportTypeIdsContainsDuplicates_ShouldHaveError()
    {
        var sportId = Guid.NewGuid();
        var command = CreateValidCommand() with { SportTypeIds = [sportId, sportId] };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.SportTypeIds);
    }

    [Fact]
    public void Validate_WhenSportTypeIdsContainsEmptyGuid_ShouldHaveError()
    {
        var command = CreateValidCommand() with { SportTypeIds = [Guid.Empty] };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.SportTypeIds);
    }

    [Fact]
    public void Validate_WhenQrImageIdIsEmpty_ShouldHaveError()
    {
        var command = CreateValidCommand() with { QrImageId = Guid.Empty };
        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.QrImageId);
    }
}
