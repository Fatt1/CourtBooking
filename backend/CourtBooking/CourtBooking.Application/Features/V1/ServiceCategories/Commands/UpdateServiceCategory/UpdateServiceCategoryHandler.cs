using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServiceCategories.Commands.UpdateServiceCategory;

internal sealed class UpdateServiceCategoryHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<UpdateServiceCategoryCommand>
{
    public async Task<Result> Handle(
        UpdateServiceCategoryCommand request,
        CancellationToken cancellationToken)
    {
        var category = await dbContext.ServiceCategories
            .FirstOrDefaultAsync(
                item => item.Id == request.Id && item.CourtOwnerId == userContext.UserId,
                cancellationToken);

        if (category is null)
        {
            return Result.Failure(new NotFoundError("ServiceCategory", request.Id));
        }

        var name = request.Name.Trim();
        var duplicateExists = await dbContext.ServiceCategories
            .AnyAsync(
                item => item.Id != request.Id
                    && item.CourtOwnerId == userContext.UserId
                    && item.Name == name,
                cancellationToken);

        if (duplicateExists)
        {
            return Result.Failure(new ConflictError("Tên loại dịch vụ đã tồn tại."));
        }

        category.Name = name;
        category.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        category.IsActive = request.IsActive;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
