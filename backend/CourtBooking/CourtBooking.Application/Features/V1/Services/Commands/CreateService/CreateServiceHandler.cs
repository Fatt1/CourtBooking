using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Services.Commands.CreateService;

internal sealed class CreateServiceHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth,
    IUserContext userContext,
    IPublisher publisher) : ICommandHandler<CreateServiceCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateServiceCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Chỉ cho phép sử dụng danh mục đang hoạt động
        var categoryExists = await dbContext.ServiceCategories
            .AnyAsync(c => c.Id == request.CategoryId
                && c.CourtOwnerId == userContext.UserId
                && c.IsActive, cancellationToken);

        if (!categoryExists)
        {
            return Result.Failure<Guid>(new NotFoundError("ServiceCategory", request.CategoryId));
        }

        // 2. Kiểm tra quyền sở hữu các chi nhánh được gán 
        var branchAuthResult = await branchAuth.EnsureOwnerOfAllAsync(
            request.Branches.Select(b => b.BranchId),
            cancellationToken);

        if (branchAuthResult.IsFailure)
        {
            return Result.Failure<Guid>(branchAuthResult.Error!);
        }

        // 3. Kiểm tra ảnh nếu có truyền
        if (request.ImageId.HasValue)
        {
            var imageExists = await dbContext.Images
                .AnyAsync(i => i.Id == request.ImageId.Value, cancellationToken);

            if (!imageExists)
            {
                return Result.Failure<Guid>(new NotFoundError("Image", request.ImageId.Value));
            }
        }

        // 4. Tạo Service và gán chi nhánh
        var service = new Service
        {
            Id = Guid.NewGuid(),
            CategoryId = request.CategoryId,
            Name = request.Name.Trim(),
            Unit = request.Unit.Trim(),
            ImageId = request.ImageId,
            Branches = request.Branches.Select(branch => new ServiceBranch
            {
                BranchId = branch.BranchId,
                Price = branch.Price,
                IsActive = branch.IsActive
            }).ToList()
        };

        await dbContext.Services.AddAsync(service, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        // 5. Bắn event đính kèm ảnh (Attached)
        if (request.ImageId.HasValue)
        {
            await publisher.Publish(new AttachImagesEvent([request.ImageId.Value]), cancellationToken);
        }

        // 6. Trả về kết quả
        return Result<Guid>.Success(service.Id);
    }
}
