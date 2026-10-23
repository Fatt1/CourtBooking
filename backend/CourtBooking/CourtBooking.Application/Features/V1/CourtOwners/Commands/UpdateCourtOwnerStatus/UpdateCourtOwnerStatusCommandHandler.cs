using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
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

        // Nếu chuyển sang Đã khóa (Inactive), thu hồi toàn bộ Refresh Tokens và chuyển các chi nhánh, sân thành Bảo trì / Tạm ngưng
        if (request.Status == UserStatus.Inactive)
        {
            var refreshTokens = await dbContext.RefreshTokens
                .Where(r => r.UserId == user.Id)
                .ToListAsync(ct);

            if (refreshTokens.Count > 0)
            {
                dbContext.RefreshTokens.RemoveRange(refreshTokens);
            }

            // Chuyển toàn bộ chi nhánh và sân của chủ sân này thành Bảo trì / Tạm dừng
            var branches = await dbContext.Branches
                .Include(b => b.CourtTypes)
                .Where(b => b.CourtOwnerId == request.CourtOwnerId)
                .ToListAsync(ct);

            foreach (var branch in branches)
            {
                branch.IsActive = false;
                branch.UpdatedAt = DateTime.UtcNow;

            }
        }

        await dbContext.SaveChangesAsync(ct);

        return Result.Success();
    }
}
