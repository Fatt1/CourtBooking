using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServiceCategories.Commands.DeleteServiceCategory;

internal sealed class DeleteServiceCategoryHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<DeleteServiceCategoryCommand>
{
    public async Task<Result> Handle(
        DeleteServiceCategoryCommand request,
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

        var isInUse = await dbContext.Services
            .AnyAsync(service => service.CategoryId == category.Id, cancellationToken);

        if (isInUse)
        {
            return Result.Failure(new ConflictError(
                "Loại dịch vụ đang được sử dụng."));
        }

        dbContext.ServiceCategories.Remove(category);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
