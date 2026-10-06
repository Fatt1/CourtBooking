using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Commands.UpdateBranch;

internal sealed class UpdateBranchHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext,
    IPublisher publisher)
    : ICommandHandler<UpdateBranchCommand>
{
    public async Task<Result> Handle(UpdateBranchCommand request, CancellationToken ct)
    {
        var branch = await dbContext.Branches
            .Include(x => x.BranchSportTypes)
            .Include(x => x.Images)
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);

        if (branch is null)
            return Result.Failure(new NotFoundError("Branch", request.Id));

        if (branch.CourtOwnerId != userContext.UserId)
            return Result.Failure(new ForbiddenError("Chi nhánh không thuộc chủ sân này."));

        // Validate môn thể thao (1 query thay vì foreach)
        var sportIds = request.SportTypeIds.Distinct().ToList();
        var validSportCount = await dbContext.SportTypes
            .CountAsync(x => sportIds.Contains(x.Id), ct);
        if (validSportCount != sportIds.Count)
            return Result.Failure(new NotFoundError("SportType", Guid.Empty));

        // Validate ảnh (1 query thay vì foreach)
        var allImageIds = new[] { request.QrImageId }
            .Concat(request.ImageIds ?? [])
            .Distinct()
            .ToList();

        var oldQrId = branch.QrImageId;

        // Cập nhật môn thể thao: xóa các môn cũ không chọn và add các môn mới
        branch.BranchSportTypes.RemoveAll(x => !sportIds.Contains(x.SportTypeId));
        foreach (var id in sportIds)
        {
            if (!branch.BranchSportTypes.Any(x => x.SportTypeId == id))
                branch.BranchSportTypes.Add(new BranchSportType { BranchId = branch.Id, SportTypeId = id });
        }

        // Cập nhật danh sách ảnh chi nhánh (lấy ra ảnh thêm mới và ảnh bị gỡ)
        var (added, removed) = branch.UpdateImages(request.ImageIds);

        // Cập nhật thông tin chi nhánh
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

        // Đánh dấu các ảnh mới thêm vào là đã sử dụng
        var toAttach = added
            .Concat(oldQrId != branch.QrImageId ? [branch.QrImageId] : [])
            .Distinct()
            .ToList();

        if (toAttach.Count > 0)
            await publisher.Publish(new AttachImagesEvent(toAttach), ct);

        // Xóa các ảnh cũ bị gỡ ra khỏi chi nhánh
        var toDelete = removed
            .Concat(oldQrId != branch.QrImageId ? [oldQrId] : [])
            .Distinct()
            .ToList();

        if (toDelete.Count > 0)
            await publisher.Publish(new DeleteImagesEvent(toDelete), ct);

        return Result.Success();
    }
}
