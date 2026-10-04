using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Identities.Commands.RefreshToken;

internal sealed class RefreshTokenCommandHandler(
    UserManager<ApplicationUser> userManager,
    IApplicationDbContext dbContext,
    IJwtTokenService jwtTokenService,
    IAuthCookieService cookieService) : ICommandHandler<RefreshTokenCommand, string>
{
    public async Task<Result<string>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // 1. Lấy token từ request body hoặc từ HttpOnly Cookie
        var tokenString = cookieService.GetRefreshTokenFromCookie();

        if (string.IsNullOrWhiteSpace(tokenString))
        {
            return Result.Failure<string>(new BadError("Không tìm thấy refresh token."));
        }

        // 2. Tìm token trong cơ sở dữ liệu
        var existingToken = await dbContext.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == tokenString, cancellationToken);

        if (existingToken is null || !existingToken.IsActive)
        {
            return Result.Failure<string>(new BadError("Refresh token không hợp lệ hoặc đã hết hạn."));
        }

        var user = existingToken.User;
        if (user.Status != UserStatus.Active || user.IsDeleted)
        {
            return Result.Failure<string>(new ForbiddenError("Tài khoản đã bị vô hiệu hóa."));
        }

        // 3. Thu hồi (Revoke) token cũ (Refresh token rotation)
        existingToken.RevokedAt = DateTime.UtcNow;

        // 4. Cấp Access Token và Refresh Token mới
        var roles = await userManager.GetRolesAsync(user);

        var newAccessToken = jwtTokenService.GenerateAccessToken(user, roles);
        var newRefreshToken = jwtTokenService.GenerateRefreshToken();
        var refreshTokenExpires = jwtTokenService.GetRefreshTokenExpiresAt();

        dbContext.RefreshTokens.Add(new Domain.Entities.Users.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = newRefreshToken,
            ExpiresAt = refreshTokenExpires,
            CreatedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        cookieService.SetRefreshTokenCookie(newRefreshToken, refreshTokenExpires);

        return Result.Success(newAccessToken);
    }
}
