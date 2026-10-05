using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Commands.DeleteBranch;

internal sealed class DeleteBranchHandler(IApplicationDbContext dbContext, IUserContext userContext, IPublisher publisher)
    : ICommandHandler<DeleteBranchCommand>
{
    public async Task<Result> Handle(DeleteBranchCommand request, CancellationToken ct)
    {
        var branch = await dbContext.Branches
            .Include(x => x.Images).Include(x => x.BranchSportTypes)
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);
        if (branch is null) return Result.Failure(new NotFoundError("Branch", request.Id));
        if (branch.CourtOwnerId != userContext.UserId)
            return Result.Failure(new ForbiddenError("Chi nhánh không thuộc chủ sân này."));

        var used = await dbContext.CourtTypes.AnyAsync(x => x.BranchId == request.Id, ct)
            || await dbContext.ServiceBranches.AnyAsync(x => x.BranchId == request.Id, ct)
            || await dbContext.Reviews.AnyAsync(x => x.BranchId == request.Id, ct)
            || await dbContext.Orders.AnyAsync(x => x.BranchId == request.Id, ct)
            || await dbContext.SocialMatches.AnyAsync(x => x.BranchId == request.Id, ct)
            || await dbContext.RetailOrders.AnyAsync(x => x.BranchId == request.Id, ct);
        if (used)
            return Result.Failure(new ConflictError("Không thể xóa chi nhánh đã có dữ liệu liên quan."));

        var images = branch.Images.Select(x => x.ImageId).Append(branch.QrImageId).Distinct().ToList();
        dbContext.Branches.Remove(branch);
        await dbContext.SaveChangesAsync(ct);
        var unused = new List<Guid>();
        foreach (var id in images)
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
