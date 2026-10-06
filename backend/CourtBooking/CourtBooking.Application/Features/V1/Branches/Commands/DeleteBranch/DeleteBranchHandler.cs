using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Commands.DeleteBranch;

internal sealed class DeleteBranchHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext,
    IPublisher publisher)
    : ICommandHandler<DeleteBranchCommand>
{
    public async Task<Result> Handle(DeleteBranchCommand request, CancellationToken ct)
    {
        var branch = await dbContext.Branches
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (branch is null)
            return Result.Failure(new NotFoundError("Branch", request.Id));

        if (branch.CourtOwnerId != userContext.UserId)
            return Result.Failure(new ForbiddenError("Chi nhánh không thuộc chủ sân này."));
        // 1. Ràng buộc: Phải có ít nhất 2 chi nhánh mới cho xóa
        var branchCount = await dbContext.Branches.CountAsync(x => x.CourtOwnerId == userContext.UserId, ct);
        if (branchCount <= 1)
            return Result.Failure(new ConflictError("Chủ sân phải có ít nhất một chi nhánh. Không thể xóa chi nhánh duy nhất còn lại."));
        // 2. Kiểm tra nếu đã có đơn đặt sân thì không được xóa
        var hasOrders = await dbContext.Orders.AnyAsync(x => x.BranchId == request.Id, ct)
            || await dbContext.RetailOrders.AnyAsync(x => x.BranchId == request.Id, ct);
        if (hasOrders)
            return Result.Failure(new ConflictError("Không thể xóa chi nhánh đã có dữ liệu đơn đặt sân."));
        // 3. Gom ảnh riêng của chi nhánh để xóa
        var imageIds = branch.Images
            .Select(x => x.ImageId)
            .Append(branch.QrImageId)
            .Distinct()
            .ToList();
        // 4. Xóa chi nhánh (Database tự động Cascade Delete ServiceBranches, BranchImages,...)
        dbContext.Branches.Remove(branch);
        await dbContext.SaveChangesAsync(ct);
        // 5. Bắn event xóa ảnh
        if (imageIds.Count > 0)
            await publisher.Publish(new DeleteImagesEvent(imageIds), ct);
        return Result.Success();
    }
}
