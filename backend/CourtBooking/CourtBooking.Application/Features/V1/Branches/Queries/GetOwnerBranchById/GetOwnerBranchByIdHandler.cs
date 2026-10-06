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
            .Select(b => new OwnerBranchDetailDto(
                Id: b.Id,
                Name: b.Name,
                Hotline: b.Hotline,
                Province: b.Province,
                District: b.District,
                Street: b.Street,
                GgMapUrl: b.GgMapUrl,
                Latitude: b.Latitude,
                Longitude: b.Longitude,
                OpenTime: b.OpenTime,
                CloseTime: b.CloseTime,
                Policy: b.Policy,
                IsActive: b.IsActive,
                QrImage: new ImageDto(b.QrImage.StorageKey, b.QrImageId),
                AccountNumber: b.AccountNumber,
                AccountName: b.AccountName,
                Sports: b.BranchSportTypes.Select(x => new BranchSportDto(x.SportTypeId, x.SportType.Name)).ToList(),
                Images: b.Images.OrderBy(x => x.DisplayOrder)
                    .Select(x => new ImageDto(x.Image.StorageKey, x.ImageId)).ToList(),
                AverageRating: b.ReviewAverage
            ))
            .FirstOrDefaultAsync(cancellationToken);

        if (branch is null)
            return Result.Failure<OwnerBranchDetailDto>(new NotFoundError("Branch", request.Id));

        return Result.Success(branch);
    }
}
