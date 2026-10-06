using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Users.Commands.SoftDeleteUser;

internal sealed class SoftDeleteUserCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<SoftDeleteUserCommand>
{
    public async Task<Result> Handle(SoftDeleteUserCommand request, CancellationToken ct)
    {
        // 1. Kiểm tra Admin không được tự xóa chính mình
        if (request.UserId == userContext.UserId)
        {
            return Result.Failure(new BadError("Bạn không thể tự xóa tài khoản của chính mình."));
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
            return Result.Failure(new BadError("Tài khoản này đã bị xóa mềm trước đó."));
        }

        // 3. Đánh dấu xóa mềm và tắt trạng thái hoạt động
        user.IsDeleted = true;
        user.Status = UserStatus.Inactive;
        user.UpdatedAt = DateTime.UtcNow;

        // 4. Thu hồi toàn bộ Refresh Token của user
        var refreshTokens = await dbContext.RefreshTokens
            .Where(r => r.UserId == user.Id)
            .ToListAsync(ct);

        if (refreshTokens.Count > 0)
        {
            dbContext.RefreshTokens.RemoveRange(refreshTokens);
        }

        await dbContext.SaveChangesAsync(ct);

        return Result.Success();
    }
}
