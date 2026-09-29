using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Infrastructure.Authorization;

internal sealed class BranchAuthorizationService(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IBranchAuthorizationService
{
    public async Task<bool> IsOwnerAsync(Guid branchId, CancellationToken cancellationToken = default)
    {
        var currentUserId = userContext.UserId;
        return await dbContext.Branches
            .AnyAsync(b => b.Id == branchId && b.CourtOwnerId == currentUserId, cancellationToken);
    }

    public async Task<bool> IsOwnerOfAllAsync(IEnumerable<Guid> branchIds, CancellationToken cancellationToken = default)
    {
        var ids = branchIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return true;
        }

        var currentUserId = userContext.UserId;
        var validCount = await dbContext.Branches
            .CountAsync(b => ids.Contains(b.Id) && b.CourtOwnerId == currentUserId, cancellationToken);

        return validCount == ids.Count;
    }

    public async Task<Result> EnsureOwnerAsync(Guid branchId, CancellationToken cancellationToken = default)
    {
        var isOwner = await IsOwnerAsync(branchId, cancellationToken);
        return isOwner
            ? Result.Success()
            : Result.Failure(new ForbiddenError("Bạn không có quyền quản lý chi nhánh này hoặc chi nhánh không tồn tại."));
    }

    public async Task<Result> EnsureOwnerOfAllAsync(IEnumerable<Guid> branchIds, CancellationToken cancellationToken = default)
    {
        var isOwner = await IsOwnerOfAllAsync(branchIds, cancellationToken);
        return isOwner
            ? Result.Success()
            : Result.Failure(new ForbiddenError("Một hoặc nhiều chi nhánh không thuộc quyền quản lý của bạn hoặc không tồn tại."));
    }
}
