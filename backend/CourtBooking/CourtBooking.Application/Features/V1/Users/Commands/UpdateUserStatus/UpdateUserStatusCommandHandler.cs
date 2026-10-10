using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Users.Commands.UpdateUserStatus;

internal sealed class UpdateUserStatusCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<UpdateUserStatusCommand>
{
    public async Task<Result> Handle(UpdateUserStatusCommand request, CancellationToken ct)
    {
        // 1. Kiểm tra Admin không được tự khóa chính mình
        if (request.UserId == userContext.UserId && request.Status != UserStatus.Active)
        {
            return Result.Failure(new BadError("Bạn không thể tự khóa tài khoản của chính mình."));
        }

        // 2. Tìm người dùng
        var user = await dbContext.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct);

        if (user is null)
        {
            return Result.Failure(new NotFoundError("User", request.UserId));
        }

        if (user.IsDeleted)
        {
            return Result.Failure(new BadError("Không thể cập nhật trạng thái của tài khoản đã bị xóa."));
        }

        // 3. Cập nhật trạng thái
        user.Status = request.Status;
        user.UpdatedAt = DateTime.UtcNow;

        // 4. Nếu khóa tài khoản, thu hồi toàn bộ Refresh Token của user đó
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
