using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Features.V1.Storages.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranchById;

internal sealed class GetOwnerBranchByIdHandler(IApplicationDbContext dbContext, IUserContext userContext)
    : IQueryHandler<GetOwnerBranchByIdQuery, OwnerBranchDetailDto>
{
    public async Task<Result<OwnerBranchDetailDto>> Handle(
        GetOwnerBranchByIdQuery request, CancellationToken cancellationToken)
    {
        var branch = await dbContext.Branches.AsNoTracking()
            .AsSplitQuery()
            .Where(b => b.Id == request.Id && b.CourtOwnerId == userContext.UserId)
            .Select(b => new
            {
                b.Id,
                b.Name,
                b.Hotline,
                b.Province,
                b.District,
                b.Street,
                b.Latitude,
                b.Longitude,
                b.MapUrl,
                b.OpenTime,
                b.CloseTime,
                b.Policy,
                b.Description,
                b.IsActive,
                QrImage = new ImageDto(b.QrImage.StorageKey, b.QrImageId),
                b.AccountNumber,
                b.AccountName,
                b.BankName,
                b.BankCode,
                Sports = b.BranchSportTypes.Select(x => new BranchSportDto(x.SportTypeId, x.SportType.Name)).ToList(),
                Images = b.Images.OrderBy(x => x.DisplayOrder)
                    .Select(x => new ImageDto(x.Image.StorageKey, x.ImageId)).ToList(),
                AverageRating = (double?)b.ReviewAverage
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (branch is null)
            return Result.Failure<OwnerBranchDetailDto>(new NotFoundError("Branch", request.Id));

        var mapUrl = !string.IsNullOrWhiteSpace(branch.MapUrl)
            ? branch.MapUrl
            : $"https://www.google.com/maps?q={branch.Latitude},{branch.Longitude}";

        var dto = new OwnerBranchDetailDto(
            Id: branch.Id,
            Name: branch.Name,
            Hotline: branch.Hotline,
            Province: branch.Province,
            District: branch.District,
            Street: branch.Street,
            MapUrl: mapUrl,
            Latitude: branch.Latitude,
            Longitude: branch.Longitude,
            OpenTime: branch.OpenTime,
            CloseTime: branch.CloseTime,
            Policy: branch.Policy,
            Description: branch.Description,
            IsActive: branch.IsActive,
            QrImage: branch.QrImage,
            AccountNumber: branch.AccountNumber,
            AccountName: branch.AccountName,
            Sports: branch.Sports,
            Images: branch.Images,
            AverageRating: branch.AverageRating,
            BankName: branch.BankName,
            BankCode: branch.BankCode);

        return Result.Success(dto);
    }
}
