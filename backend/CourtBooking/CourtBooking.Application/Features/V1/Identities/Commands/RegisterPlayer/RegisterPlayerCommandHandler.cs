using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;

namespace CourtBooking.Application.Features.V1.Identities.Commands.RegisterPlayer;

internal sealed class RegisterPlayerCommandHandler(
    UserManager<ApplicationUser> userManager,
    RoleManager<ApplicationRole> roleManager,
    IApplicationDbContext dbContext,
    IJwtTokenService jwtTokenService,
    IAuthCookieService cookieService) : ICommandHandler<RegisterPlayerCommand, AuthResponse>
{
    public async Task<Result<AuthResponse>> Handle(RegisterPlayerCommand request, CancellationToken ct)
    {
        // 1. Kiểm tra email đã tồn tại hay chưa
        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            return Result.Failure<AuthResponse>(new ConflictError("Email này đã được sử dụng trên hệ thống."));
        }

        // 2. Tạo ApplicationUser
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            AccountType = AccountType.Player,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var identityResult = await userManager.CreateAsync(user, request.Password);
        if (!identityResult.Succeeded)
        {
            var errors = string.Join("; ", identityResult.Errors.Select(e => e.Description));
            return Result.Failure<AuthResponse>(new BadError(errors));
        }

        // 3. Đảm bảo role "Player" tồn tại và gán cho user
        const string playerRole = "Player";
        if (!await roleManager.RoleExistsAsync(playerRole))
        {
            await roleManager.CreateAsync(new ApplicationRole
            {
                Id = Guid.NewGuid(),
                Name = playerRole,
                NormalizedName = playerRole.ToUpperInvariant()
            });
        }
        await userManager.AddToRoleAsync(user, playerRole);

        // 4. Tạo hồ sơ người chơi (PlayerProfile)
        dbContext.PlayerProfiles.Add(new PlayerProfile
        {
            Id = user.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        // 5. Cấp Access Token và Refresh Token
        var accessToken = jwtTokenService.GenerateAccessToken(user, [playerRole]);
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
            playerRole,
            accessToken,
            MustChangePassword: false));
    }
}
