using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Constants;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.CourtOwners.Commands.CreateCourtOwner;

internal sealed class CreateCourtOwnerCommandHandler(
    UserManager<ApplicationUser> userManager,
    IApplicationDbContext dbContext) : ICommandHandler<CreateCourtOwnerCommand, Guid>
{
    private const string DefaultInitialPassword = "Owner@123456";

    public async Task<Result<Guid>> Handle(CreateCourtOwnerCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        // 1. Kiểm tra Email đã tồn tại hay chưa
        var existingUser = await userManager.Users
            .FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted, ct);

        if (existingUser is not null)
        {
            return Result.Failure<Guid>(new ConflictError("Email này đã được sử dụng trên hệ thống."));
        }

        // 2. Xác định mật khẩu ban đầu
        var initialPassword = !string.IsNullOrWhiteSpace(request.Password)
            ? request.Password.Trim()
            : DefaultInitialPassword;

        // 3. Khởi tạo tài khoản ApplicationUser
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            AccountType = AccountType.CourtOwner,
            Status = UserStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var identityResult = await userManager.CreateAsync(user, initialPassword);
        if (!identityResult.Succeeded)
        {
            var errors = string.Join("; ", identityResult.Errors.Select(e => e.Description));
            return Result.Failure<Guid>(new BadError(errors));
        }

        await userManager.AddToRoleAsync(user, RoleConstants.CourtOwner);

        // 4. Đảm bảo có QrImageId hợp lệ cho ràng buộc Foreign Key của CourtOwner
        var defaultQrImage = await dbContext.Images
            .FirstOrDefaultAsync(img => img.StorageKey.Contains("qr"), ct)
            ?? await dbContext.Images.FirstOrDefaultAsync(ct);

        if (defaultQrImage is null)
        {
            defaultQrImage = new Image
            {
                Id = Guid.NewGuid(),
                StorageProvider = StorageProvider.S3,
                StorageKey = "images/qr/default-qr.webp",
                Status = ImageStatus.Attached,
                CreatedAt = DateTime.UtcNow,
                AttachedAt = DateTime.UtcNow
            };
            dbContext.Images.Add(defaultQrImage);
        }

        // 5. Khởi tạo hồ sơ Chủ sân (CourtOwner) kèm cờ MustChangePwd
        var businessName = !string.IsNullOrWhiteSpace(request.BusinessName)
            ? request.BusinessName.Trim()
            : $"Sân của {request.FullName.Trim()}";

        var courtOwner = new CourtOwner
        {
            Id = user.Id,
            BusinessName = businessName,
            MustChangePwd = request.MustChangePwd,
            QrImageId = defaultQrImage.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.CourtOwners.Add(courtOwner);
        await dbContext.SaveChangesAsync(ct);

        return Result.Success(user.Id);
    }
}
