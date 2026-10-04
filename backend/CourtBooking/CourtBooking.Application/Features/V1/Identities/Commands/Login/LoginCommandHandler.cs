using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Identities.Commands.Login;

internal sealed class LoginCommandHandler(
    UserManager<ApplicationUser> userManager,
    IApplicationDbContext dbContext,
    IJwtTokenService jwtTokenService,
    IAuthCookieService cookieService) : ICommandHandler<LoginCommand, AuthResponse>
{
    public async Task<Result<AuthResponse>> Handle(LoginCommand request, CancellationToken ct)
    {
        // 1. Tìm người dùng theo Email và ExpectedAccountType (nếu có tách cổng đăng nhập)
        var query = userManager.Users
            .Include(u => u.CourtOwner)
            .Where(u => u.Email == request.Email && !u.IsDeleted);

        if (request.ExpectedAccountType.HasValue)
        {
            query = query.Where(u => u.AccountType == request.ExpectedAccountType.Value);
        }

        var user = await query.FirstOrDefaultAsync(ct);

        if (user is null)
        {
            return Result.Failure<AuthResponse>(new BadError("Email hoặc mật khẩu không chính xác."));
        }

        // 2. Kiểm tra mật khẩu
        var isPasswordValid = await userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            return Result.Failure<AuthResponse>(new BadError("Email hoặc mật khẩu không chính xác."));
        }

        // 3. Kiểm tra trạng thái tài khoản
        if (user.Status != UserStatus.Active)
        {
            return Result.Failure<AuthResponse>(new ForbiddenError("Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt."));
        }

        // 4. Lấy danh sách Roles
        var roles = await userManager.GetRolesAsync(user);
        var primaryRole = roles.FirstOrDefault() ?? user.AccountType.ToString();

        // 5. Kiểm tra cờ MustChangePwd của Chủ sân theo SRS mục 1.1
        bool mustChangePassword = user.CourtOwner?.MustChangePwd ?? false;

        // 6. Cấp Access Token và Refresh Token
        var accessToken = jwtTokenService.GenerateAccessToken(user, roles);
        var refreshTokenString = jwtTokenService.GenerateRefreshToken();
        var refreshTokenExpires = DateTime.UtcNow.AddDays(7);

        dbContext.RefreshTokens.Add(new Domain.Entities.Users.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshTokenString,
            ExpiresAt = refreshTokenExpires,
            CreatedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(ct);

        cookieService.SetRefreshTokenCookie(refreshTokenString, refreshTokenExpires);

        return Result.Success(new AuthResponse(
            user.Id,
            user.Email!,
            user.FullName,
            primaryRole,
            accessToken,
            MustChangePassword: mustChangePassword));
    }
}
