using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Commands.UpdateBranch;

internal sealed class UpdateBranchHandler(IApplicationDbContext dbContext, IUserContext userContext, IPublisher publisher)
    : ICommandHandler<UpdateBranchCommand>
{
    public async Task<Result> Handle(UpdateBranchCommand request, CancellationToken ct)
    {
        var branch = await dbContext.Branches
            .Include(x => x.BranchSportTypes).Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);
        if (branch is null) return Result.Failure(new NotFoundError("Branch", request.Id));
        if (branch.CourtOwnerId != userContext.UserId)
            return Result.Failure(new ForbiddenError("Chi nhánh không thuộc chủ sân này."));

        foreach (var id in request.SportTypeIds)
        {
            if (!await dbContext.SportTypes.AnyAsync(x => x.Id == id, ct))
                return Result.Failure(new NotFoundError("SportType", id));
        }

        foreach (var id in new[] { request.QrImageId }.Concat(request.ImageIds ?? []).Distinct())
        {
            if (!await dbContext.Images.AnyAsync(x => x.Id == id && x.Status != ImageStatus.Deleted, ct))
                return Result.Failure(new NotFoundError("Image", id));
        }

        var oldQrId = branch.QrImageId;
        var targetSports = request.SportTypeIds.ToHashSet();
        var removedSports = branch.BranchSportTypes.Where(x => !targetSports.Contains(x.SportTypeId)).ToList();
        foreach (var item in removedSports)
        {
            branch.BranchSportTypes.Remove(item);
            dbContext.BranchSportTypes.Remove(item);
        }
        foreach (var id in targetSports.Except(branch.BranchSportTypes.Select(x => x.SportTypeId)))
            branch.BranchSportTypes.Add(new BranchSportType { BranchId = branch.Id, SportTypeId = id });

        var (added, removed) = branch.UpdateImages(request.ImageIds);
        branch.Name = request.Name.Trim();
        branch.Hotline = request.Hotline.Trim();
        branch.Province = request.Province.Trim();
        branch.District = request.District.Trim();
        branch.Street = request.Street.Trim();
        branch.GgMapUrl = request.GgMapUrl.Trim();
        branch.OpenTime = request.OpenTime;
        branch.CloseTime = request.CloseTime;
        branch.QrImageId = request.QrImageId;
        branch.AccountNumber = request.AccountNumber.Trim();
        branch.AccountName = request.AccountName.Trim();
        branch.Policy = request.Policy?.Trim();
        branch.Latitude = request.Latitude;
        branch.Longitude = request.Longitude;
        await dbContext.SaveChangesAsync(ct);

        var toAttach = added.Concat(oldQrId == branch.QrImageId ? [] : [branch.QrImageId]).Distinct();
        await publisher.Publish(new AttachImagesEvent(toAttach), ct);
        var unused = new List<Guid>();
        foreach (var id in removed.Concat(oldQrId == branch.QrImageId ? [] : [oldQrId]).Distinct())
        {
            var referenced = await dbContext.Branches.AnyAsync(x => x.QrImageId == id, ct)
                || await dbContext.BranchImages.AnyAsync(x => x.ImageId == id, ct)
                || await dbContext.SportTypes.AnyAsync(x => x.ImageId == id, ct)
                || await dbContext.Reviews.AnyAsync(x => x.ImageId == id, ct)
                || await dbContext.Services.AnyAsync(x => x.ImageId == id, ct)
                || await dbContext.CourtOwners.AnyAsync(x => x.QrImageId == id, ct)
                || await dbContext.PlayerProfiles.AnyAsync(x => x.AvatarImageId == id, ct)
                || await dbContext.PaymentTransactions.AnyAsync(x => x.ProofImageId == id, ct)
                || await dbContext.EventTickets.AnyAsync(x => x.ProofImageId == id, ct);
            if (!referenced) unused.Add(id);
        }
        if (unused.Count > 0)
            await publisher.Publish(new DeleteImagesEvent(unused), ct);
        return Result.Success();
    }
}
