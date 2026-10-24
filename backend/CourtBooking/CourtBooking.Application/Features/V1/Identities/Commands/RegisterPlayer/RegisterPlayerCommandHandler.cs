using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Identities.Commands.RegisterPlayer;

internal sealed class RegisterPlayerCommandHandler(
    UserManager<ApplicationUser> userManager,
    IApplicationDbContext dbContext) : ICommandHandler<RegisterPlayerCommand>
{
    public async Task<Result> Handle(RegisterPlayerCommand request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra email và accountType đã tồn tại hay chưa
        var trimmedEmail = request.Email.Trim();
        var existingUser = await userManager.Users
            .FirstOrDefaultAsync(u => u.Email == trimmedEmail && u.AccountType == AccountType.Player && !u.IsDeleted, cancellationToken);

        if (existingUser is not null)
        {
            return Result.Failure(new ConflictError("Email này đã được sử dụng trên hệ thống."));
        }

        // 1.1 Kiểm tra số điện thoại và accountType đã tồn tại hay chưa
        var trimmedPhone = request.PhoneNumber?.Trim();
        if (!string.IsNullOrWhiteSpace(trimmedPhone))
        {
            var phoneExists = await userManager.Users
                .AnyAsync(u => u.PhoneNumber == trimmedPhone && u.AccountType == AccountType.Player && !u.IsDeleted, cancellationToken);
            if (phoneExists)
            {
                return Result.Failure(new ConflictError("Số điện thoại này đã được đăng ký cho tài khoản người chơi khác."));
            }
        }

        // 2. Tạo ApplicationUser
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = trimmedEmail,
            Email = trimmedEmail,
            FullName = request.FullName.Trim(),
            PhoneNumber = trimmedPhone,
            AccountType = AccountType.Player,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var identityResult = await userManager.CreateAsync(user, request.Password);
        if (!identityResult.Succeeded)
        {
            var errors = string.Join("; ", identityResult.Errors.Select(e => e.Description));
            return Result.Failure(new BadError(errors));
        }
        await userManager.AddToRoleAsync(user, RoleConstants.Player);


        // 4. Tạo hồ sơ người chơi (PlayerProfile)
        dbContext.PlayerProfiles.Add(new PlayerProfile
        {
            Id = user.Id,
            Gender = request.Gender

        });


        await dbContext.SaveChangesAsync(cancellationToken);



        return Result.Success();
    }
}
