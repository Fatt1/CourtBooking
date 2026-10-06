using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Commands.CreateBranch;

internal sealed class CreateBranchHandler(IApplicationDbContext dbContext, IUserContext userContext, IPublisher publisher)
    : ICommandHandler<CreateBranchCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateBranchCommand request, CancellationToken ct)
    {
        if (!await dbContext.CourtOwners.AnyAsync(x => x.Id == userContext.UserId, ct))
            return Result.Failure<Guid>(new ForbiddenError("Tài khoản không phải chủ sân."));

        foreach (var id in request.SportTypeIds)
        {
            if (!await dbContext.SportTypes.AnyAsync(x => x.Id == id, ct))
                return Result.Failure<Guid>(new NotFoundError("SportType", id));
        }


        var branch = new Branch
        {
            Id = Guid.CreateVersion7(),
            CourtOwnerId = userContext.UserId,
            IsActive = true,
            BranchSportTypes = request.SportTypeIds.Select(id => new BranchSportType { SportTypeId = id }).ToList(),
            Name = request.Name.Trim(),
            Hotline = request.Hotline.Trim(),
            Province = request.Province.Trim(),
            District = request.District.Trim(),
            Street = request.Street.Trim(),
            GgMapUrl = request.GgMapUrl.Trim(),
            OpenTime = request.OpenTime,
            CloseTime = request.CloseTime,
            QrImageId = request.QrImageId,
            AccountNumber = request.AccountNumber.Trim(),
            AccountName = request.AccountName.Trim(),
            Policy = request.Policy?.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude
        };
        branch.UpdateImages(request.ImageIds);
        await dbContext.Branches.AddAsync(branch, ct);
        await dbContext.SaveChangesAsync(ct);
        await publisher.Publish(new AttachImagesEvent(new[] { request.QrImageId }
            .Concat(request.ImageIds ?? []).Distinct()), ct);
        return Result.Success(branch.Id);
    }
}
