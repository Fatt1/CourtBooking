using System.Text;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Identities.Commands.ResetPassword;

internal sealed class ResetPasswordCommandHandler(
    UserManager<ApplicationUser> userManager,
    IApplicationDbContext dbContext) : ICommandHandler<ResetPasswordCommand>
{
    public async Task<Result> Handle(ResetPasswordCommand request, CancellationToken ct)
    {
        // 1. Tìm người dùng theo Email và ExpectedAccountType (nếu có)
        var query = userManager.Users
            .Include(u => u.CourtOwner)
            .Where(u => u.Email == request.Email && !u.IsDeleted);

        if (request.ExpectedAccountType.HasValue)
        {
            query = query.Where(u => u.AccountType == request.ExpectedAccountType.Value);
        }

        var user = await query.FirstOrDefaultAsync(ct);

        if (user is null || user.Status != UserStatus.Active)
        {
            return Result.Failure(new BadError("Yêu cầu đặt lại mật khẩu không hợp lệ hoặc tài khoản đã bị khóa."));
        }

        // 2. Giải mã token URL-safe Base64 về định dạng token gốc
        string rawToken;
        try
        {
            string incoming = request.Token.Replace('-', '+').Replace('_', '/');
            switch (incoming.Length % 4)
            {
                case 2: incoming += "=="; break;
                case 3: incoming += "="; break;
            }
            var decodedBytes = Convert.FromBase64String(incoming);
            rawToken = Encoding.UTF8.GetString(decodedBytes);
        }
        catch
        {
            return Result.Failure(new BadError("Định dạng mã xác nhận (Token) không hợp lệ."));
        }

        // 3. Thực hiện Reset Password qua Identity
        var resetResult = await userManager.ResetPasswordAsync(user, rawToken, request.NewPassword);
        if (!resetResult.Succeeded)
        {
            var errors = string.Join("; ", resetResult.Errors.Select(e => e.Description));
            return Result.Failure(new BadError($"Đặt lại mật khẩu thất bại: {errors}"));
        }

        // 4. Thu hồi toàn bộ Refresh Tokens cũ để đảm bảo an toàn (buộc đăng nhập lại)
        var activeTokens = await dbContext.RefreshTokens
            .Where(rt => rt.UserId == user.Id && rt.RevokedAt == null)
            .ToListAsync(ct);

        foreach (var rt in activeTokens)
        {
            rt.RevokedAt = DateTime.UtcNow;
        }

        // 5. Nếu là Chủ sân đang có cờ MustChangePwd thì tắt cờ
        if (user.CourtOwner is not null && user.CourtOwner.MustChangePwd)
        {
            user.CourtOwner.MustChangePwd = false;
            user.CourtOwner.UpdatedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(ct);

        return Result.Success();
    }
}
