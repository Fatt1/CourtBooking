using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Application.Features.V1.Storages.Events.DeleteImages;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Services.Commands.UpdateService;

internal sealed class UpdateServiceHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth,
    IPublisher publisher) : ICommandHandler<UpdateServiceCommand>
{
    public async Task<Result> Handle(
        UpdateServiceCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Tải Service cùng danh sách ServiceBranch
        var service = await dbContext.Services
            .Include(s => s.Branches)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (service is null)
        {
            return Result.Failure(new NotFoundError("Service", request.Id));
        }

        // 2. Kiểm tra danh mục tồn tại
        var categoryExists = await dbContext.ServiceCategories
            .AnyAsync(c => c.Id == request.CategoryId, cancellationToken);

        if (!categoryExists)
        {
            return Result.Failure(new NotFoundError("ServiceCategory", request.CategoryId));
        }

        // 3. Kiểm tra ảnh mới nếu có thay đổi
        if (request.ImageId.HasValue && request.ImageId != service.ImageId)
        {
            var imageExists = await dbContext.Images
                .AnyAsync(i => i.Id == request.ImageId.Value, cancellationToken);

            if (!imageExists)
            {
                return Result.Failure(new NotFoundError("Image", request.ImageId.Value));
            }
        }

        // 4. Đồng bộ danh sách chi nhánh (Thêm mới, Cập nhật, Xóa)
        List<ServiceBranchItemDto>? incomingBranches = null;

        if (request.Branches is not null)
        {
            incomingBranches = request.Branches;
        }

        if (incomingBranches is not null)
        {
            var incomingBranchIds = incomingBranches.Select(b => b.BranchId).ToHashSet();
            var existingBranchIds = service.Branches.Select(b => b.BranchId).ToHashSet();

            // 4.1 Kiểm tra quyền sở hữu các chi nhánh mới/cập nhật
            if (incomingBranchIds.Count > 0)
            {
                var branchAuthResult = await branchAuth.EnsureOwnerOfAllAsync(
                    incomingBranchIds,
                    cancellationToken);

                if (branchAuthResult.IsFailure)
                {
                    return branchAuthResult;
                }
            }

            // 4.2 Tìm các chi nhánh bị gỡ bỏ khỏi dịch vụ
            var branchesToRemove = existingBranchIds.Except(incomingBranchIds).ToHashSet();
            if (branchesToRemove.Count > 0)
            {
                service.Branches.RemoveAll(b => branchesToRemove.Contains(b.BranchId));
            }

            // 4.3 Cập nhật thông tin cho các chi nhánh đã tồn tại
            var branchesToUpdate = incomingBranches.Where(b => existingBranchIds.Contains(b.BranchId));
            foreach (var branch in branchesToUpdate)
            {
                var existing = service.Branches.FirstOrDefault(b => b.BranchId == branch.BranchId);
                if (existing is not null)
                {
                    existing.Price = branch.Price;
                    existing.IsActive = branch.IsActive;
                }
            }

            // 4.4 Thêm mới các chi nhánh
            var branchesToAdd = incomingBranches.Where(b => !existingBranchIds.Contains(b.BranchId));
            foreach (var branch in branchesToAdd)
            {
                service.Branches.Add(new ServiceBranch
                {
                    ServiceId = service.Id,
                    BranchId = branch.BranchId,
                    Price = branch.Price,
                    IsActive = branch.IsActive
                });
            }
        }

        // 5. Cập nhật thông tin dịch vụ và lấy ảnh cũ (nếu có thay đổi)
        var oldImageId = service.ImageId;
        service.CategoryId = request.CategoryId;
        service.Name = request.Name.Trim();
        service.Unit = request.Unit.Trim();
        service.ImageId = request.ImageId;

        await dbContext.SaveChangesAsync(cancellationToken);

        // 6. Quản lý sự kiện hình ảnh:
        if (request.ImageId.HasValue && request.ImageId != oldImageId)
        {
            await publisher.Publish(new AttachImagesEvent([request.ImageId.Value]), cancellationToken);
        }

        if (oldImageId.HasValue && oldImageId != request.ImageId)
        {
            await publisher.Publish(new DeleteImagesEvent([oldImageId.Value]), cancellationToken);
        }

        // 7. Trả về thành công
        return Result.Success();
    }
}
