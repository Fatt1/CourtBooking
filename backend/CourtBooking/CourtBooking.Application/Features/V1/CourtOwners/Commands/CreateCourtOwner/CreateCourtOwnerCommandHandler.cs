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
    public async Task<Result<Guid>> Handle(CreateCourtOwnerCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        // 1. Kiểm tra Email đã tồn tại hay chưa
        var existingUser = await userManager.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.AccountType == AccountType.CourtOwner, ct);

        if (existingUser is not null)
        {
            return Result.Failure<Guid>(new ConflictError("Email này đã được sử dụng trên hệ thống."));
        }

        var phone = request.PhoneNumber.Trim();
        var phoneExists = await userManager.Users
            .AnyAsync(u => u.PhoneNumber == phone && u.AccountType == AccountType.CourtOwner && !u.IsDeleted, ct);
        if (phoneExists)
        {
            return Result.Failure<Guid>(new ConflictError("Số điện thoại này đã được sử dụng cho một tài khoản chủ sân khác."));
        }

        // 2. Kiểm tra Gói dịch vụ bắt buộc tồn tại
        var selectedPackage = await dbContext.ServicePackages
            .FirstOrDefaultAsync(p => p.Id == request.ServicePackageId, ct);

        if (selectedPackage is null)
        {
            return Result.Failure<Guid>(new NotFoundError("ServicePackage", request.ServicePackageId));
        }

        // 3. Khởi tạo tài khoản ApplicationUser với mật khẩu bắt buộc
        var initialPassword = request.Password.Trim();

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email + $"-{AccountType.CourtOwner}",
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

        // 4. Khởi tạo hồ sơ Chủ sân (CourtOwner) kèm cờ MustChangePwd và gói dịch vụ
        var businessName = !string.IsNullOrWhiteSpace(request.BusinessName)
            ? request.BusinessName.Trim()
            : $"Sân của {request.FullName.Trim()}";

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var endDate = today.AddMonths(selectedPackage.DurationMonths > 0 ? selectedPackage.DurationMonths : 1);

        var courtOwner = new CourtOwner
        {
            Id = user.Id,
            BusinessName = businessName,
            MustChangePwd = request.MustChangePwd,
            ServicePackageId = selectedPackage.Id,
            PackageStartDate = today,
            PackageEndDate = endDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.CourtOwners.Add(courtOwner);

        // 5. Gán gói dịch vụ ban đầu cho chủ sân mới trong lịch sử đăng ký
        var initialSub = new Domain.Entities.Subscriptions.CourtOwnerSubscription
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = user.Id,
            ServicePackageId = selectedPackage.Id,
            PricePaid = selectedPackage.Price,
            StartDate = today,
            EndDate = endDate,
            CreatedAt = DateTime.UtcNow
        };
        dbContext.CourtOwnerSubscriptions.Add(initialSub);

        await dbContext.SaveChangesAsync(ct);

        return Result.Success(user.Id);
    }
}
