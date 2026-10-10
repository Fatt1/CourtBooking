using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.CourtOwners.Commands.UpdateCourtOwnerStatus;

internal sealed class UpdateCourtOwnerStatusCommandHandler(
    IApplicationDbContext dbContext) : ICommandHandler<UpdateCourtOwnerStatusCommand>
{
    public async Task<Result> Handle(UpdateCourtOwnerStatusCommand request, CancellationToken ct)
    {
        var user = await dbContext.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == request.CourtOwnerId && u.AccountType == AccountType.CourtOwner, ct);

        if (user is null)
        {
            return Result.Failure(new NotFoundError("CourtOwner", request.CourtOwnerId));
        }

        user.Status = request.Status;
        user.UpdatedAt = DateTime.UtcNow;

        // Nếu chuyển sang Đã khóa (Inactive), thu hồi toàn bộ Refresh Tokens
        if (request.Status == UserStatus.Inactive)
        {
            var refreshTokens = await dbContext.RefreshTokens
                .Where(r => r.UserId == user.Id)
                .ToListAsync(ct);

            if (refreshTokens.Count > 0)
            {
                dbContext.RefreshTokens.RemoveRange(refreshTokens);
            }
        }

        await dbContext.SaveChangesAsync(ct);

        return Result.Success();
    }
}
