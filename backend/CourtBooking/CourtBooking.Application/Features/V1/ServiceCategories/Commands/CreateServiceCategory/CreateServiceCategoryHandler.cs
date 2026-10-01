using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.ServiceCategories.Commands.CreateServiceCategory;

internal sealed class CreateServiceCategoryHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<CreateServiceCategoryCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateServiceCategoryCommand request,
        CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        var duplicateExists = await dbContext.ServiceCategories
            .AnyAsync(
                category => category.CourtOwnerId == userContext.UserId
                    && category.Name == name,
                cancellationToken);

        if (duplicateExists)
        {
            return Result.Failure<Guid>(new ConflictError("Tên loại dịch vụ đã tồn tại."));
        }

        var category = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = userContext.UserId,
            Name = name,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            IsActive = request.IsActive
        };

        await dbContext.ServiceCategories.AddAsync(category, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(category.Id);
    }
}
