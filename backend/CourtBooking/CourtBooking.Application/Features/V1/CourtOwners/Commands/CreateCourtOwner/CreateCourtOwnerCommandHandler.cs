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

        // 2. Xác định mật khẩu ban đầu
        var initialPassword = !string.IsNullOrWhiteSpace(request.Password)
            ? request.Password.Trim()
            : DefaultInitialPassword;

        // 3. Khởi tạo tài khoản ApplicationUser
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

        // 5. Khởi tạo hồ sơ Chủ sân (CourtOwner) kèm cờ MustChangePwd
        var businessName = !string.IsNullOrWhiteSpace(request.BusinessName)
            ? request.BusinessName.Trim()
            : $"Sân của {request.FullName.Trim()}";

        var courtOwner = new CourtOwner
        {
            Id = user.Id,
            BusinessName = businessName,
            MustChangePwd = request.MustChangePwd,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.CourtOwners.Add(courtOwner);

        // 6. Gán gói dịch vụ ban đầu cho chủ sân mới (theo gói được chọn hoặc mặc định)
        Domain.Entities.Subscriptions.ServicePackage? selectedPackage = null;
        if (request.ServicePackageId.HasValue && request.ServicePackageId.Value != Guid.Empty)
        {
            selectedPackage = await dbContext.ServicePackages
                .FirstOrDefaultAsync(p => p.Id == request.ServicePackageId.Value, ct);
        }

        selectedPackage ??= await dbContext.ServicePackages
            .FirstOrDefaultAsync(p => p.Price == 499000m, ct)
            ?? await dbContext.ServicePackages
                .FirstOrDefaultAsync(p => p.Name.Contains("Cơ Bản") || p.Name.Contains("Basic"), ct)
            ?? await dbContext.ServicePackages.FirstOrDefaultAsync(ct);

        if (selectedPackage is not null)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var initialSub = new Domain.Entities.Subscriptions.CourtOwnerSubscription
            {
                Id = Guid.NewGuid(),
                CourtOwnerId = user.Id,
                ServicePackageId = selectedPackage.Id,
                PricePaid = selectedPackage.Price,
                StartDate = today,
                EndDate = today.AddMonths(selectedPackage.DurationMonths > 0 ? selectedPackage.DurationMonths : 1),
                CreatedAt = DateTime.UtcNow
            };
            dbContext.CourtOwnerSubscriptions.Add(initialSub);
        }

        await dbContext.SaveChangesAsync(ct);

        return Result.Success(user.Id);
    }
}
