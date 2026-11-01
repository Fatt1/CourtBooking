using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Identities.Commands.ExternalLogin;

internal sealed class ExternalLoginCommandHandler(
    UserManager<ApplicationUser> userManager,
    IApplicationDbContext dbContext,
    IExternalAuthService externalAuthService,
    IJwtTokenService jwtTokenService,
    IAuthCookieService cookieService) : ICommandHandler<ExternalLoginCommand, LoginResponse>
{
    public async Task<Result<LoginResponse>> Handle(ExternalLoginCommand request, CancellationToken cancellationToken)
    {
        // 1. Xác thực Token từ Google hoặc Facebook
        var normalizedProvider = request.Provider.Trim().ToLowerInvariant();
        Result<ExternalAuthUserInfo> verifyResult;

        if (normalizedProvider == "google")
        {
            verifyResult = await externalAuthService.VerifyGoogleTokenAsync(request.Token, cancellationToken);
        }
        else if (normalizedProvider == "facebook")
        {
            verifyResult = await externalAuthService.VerifyFacebookTokenAsync(request.Token, cancellationToken);
        }
        else
        {
            return Result.Failure<LoginResponse>(new BadError($"Phương thức đăng nhập '{request.Provider}' không được hỗ trợ."));
        }

        if (verifyResult.IsFailure)
        {
            return Result.Failure<LoginResponse>(verifyResult.Error);
        }

        var externalInfo = verifyResult.Value;

        // 2. Tìm người dùng đã từng liên kết Provider này hay chưa
        var user = await userManager.FindByLoginAsync(externalInfo.Provider, externalInfo.ProviderKey);

        if (user is null)
        {
            // 2.1 Chưa liên kết: Tìm xem đã có tài khoản theo Email với AccountType tương ứng hay chưa
            var existingUser = await userManager.Users
                .Include(u => u.CourtOwner)
                .FirstOrDefaultAsync(u => u.Email == externalInfo.Email && u.AccountType == request.ExpectedAccountType && !u.IsDeleted, cancellationToken);

            if (existingUser is not null)
            {
                user = existingUser;
                // Tự động liên kết provider vào tài khoản có sẵn
                var addLoginResult = await userManager.AddLoginAsync(user, new UserLoginInfo(externalInfo.Provider, externalInfo.ProviderKey, externalInfo.Provider));
                if (!addLoginResult.Succeeded)
                {
                    var errors = string.Join("; ", addLoginResult.Errors.Select(e => e.Description));
                    return Result.Failure<LoginResponse>(new BadError($"Liên kết tài khoản thất bại: {errors}"));
                }
            }
            else
            {
                // 2.2 Chưa có tài khoản: Tạo tài khoản mới
                user = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    UserName = externalInfo.Email,
                    Email = externalInfo.Email,
                    FullName = string.IsNullOrWhiteSpace(externalInfo.FullName) ? externalInfo.Email : externalInfo.FullName,
                    AccountType = request.ExpectedAccountType,
                    Status = UserStatus.Active,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var createResult = await userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                {
                    var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
                    return Result.Failure<LoginResponse>(new BadError($"Tạo tài khoản mới thất bại: {errors}"));
                }

                var roleName = RoleConstants.FromAccountType(request.ExpectedAccountType);
                await userManager.AddToRoleAsync(user, roleName);

                if (request.ExpectedAccountType == AccountType.Player)
                {
                    dbContext.PlayerProfiles.Add(new PlayerProfile
                    {
                        Id = user.Id,
                        Gender = Gender.Male // Mặc định
                    });
                    await dbContext.SaveChangesAsync(cancellationToken);
                }

                // Gắn liên kết mạng xã hội vào tài khoản mới
                var addLoginResult = await userManager.AddLoginAsync(user, new UserLoginInfo(externalInfo.Provider, externalInfo.ProviderKey, externalInfo.Provider));
                if (!addLoginResult.Succeeded)
                {
                    var errors = string.Join("; ", addLoginResult.Errors.Select(e => e.Description));
                    return Result.Failure<LoginResponse>(new BadError($"Liên kết tài khoản thất bại: {errors}"));
                }
            }
        }

        // 3. Kiểm tra trạng thái tài khoản
        if (user.IsDeleted || user.Status != UserStatus.Active)
        {
            return Result.Failure<LoginResponse>(new ForbiddenError("Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt."));
        }

        // 4. Lấy danh sách Roles
        var roles = await userManager.GetRolesAsync(user);
        bool mustChangePassword = user.CourtOwner?.MustChangePwd ?? false;

        // 5. Cấp Access Token và Refresh Token
        var accessToken = jwtTokenService.GenerateAccessToken(user, roles);
        var refreshTokenString = jwtTokenService.GenerateRefreshToken();
        var refreshTokenExpires = jwtTokenService.GetRefreshTokenExpiresAt();

        dbContext.RefreshTokens.Add(new Domain.Entities.Users.RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshTokenString,
            ExpiresAt = refreshTokenExpires,
            CreatedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        cookieService.SetRefreshTokenCookie(refreshTokenString, refreshTokenExpires);

        var primaryRole = roles.FirstOrDefault() ?? RoleConstants.FromAccountType(user.AccountType);

        return Result.Success(new LoginResponse(
            user.Id,
            user.Email!,
            user.FullName,
            accessToken,
            primaryRole,
            mustChangePassword,
            user.PhoneNumber));
    }
}
