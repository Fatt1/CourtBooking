using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Identities.Commands.UpdateOwnerProfile;

internal sealed class UpdateOwnerProfileCommandHandler(
    UserManager<ApplicationUser> userManager,
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<UpdateOwnerProfileCommand>
{
    public async Task<Result> Handle(UpdateOwnerProfileCommand request, CancellationToken ct)
    {
        var userId = userContext.UserId;
        var user = await userManager.Users
            .Include(u => u.CourtOwner)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, ct);

        if (user is null || user.CourtOwner is null)
        {
            return Result.Failure(new NotFoundError("CourtOwner", userId));
        }

        var trimmedEmail = request.Email.Trim();
        if (!string.Equals(user.Email, trimmedEmail, StringComparison.OrdinalIgnoreCase))
        {
            var emailExists = await userManager.Users
                .AnyAsync(u => u.Email == trimmedEmail && u.Id != userId, ct);
            if (emailExists)
            {
                return Result.Failure(new ConflictError($"Email '{trimmedEmail}' đã được sử dụng bởi tài khoản khác."));
            }

            user.Email = trimmedEmail;
            user.NormalizedEmail = trimmedEmail.ToUpperInvariant();
            user.UserName = trimmedEmail;
            user.NormalizedUserName = trimmedEmail.ToUpperInvariant();
        }

        var trimmedPhone = request.PhoneNumber.Trim();
        if (!string.Equals(user.PhoneNumber, trimmedPhone, StringComparison.OrdinalIgnoreCase))
        {
            var phoneExists = await userManager.Users
                .AnyAsync(u => u.PhoneNumber == trimmedPhone && u.Id != userId && u.AccountType == AccountType.CourtOwner && !u.IsDeleted, ct);
            if (phoneExists)
            {
                return Result.Failure(new ConflictError($"Số điện thoại '{trimmedPhone}' đã được sử dụng bởi tài khoản khác."));
            }
        }

        user.FullName = request.FullName.Trim();
        user.PhoneNumber = trimmedPhone;
        user.UpdatedAt = DateTime.UtcNow;

        user.CourtOwner.BusinessName = request.BusinessName.Trim();
        user.CourtOwner.TaxCode = string.IsNullOrWhiteSpace(request.TaxCode) ? null : request.TaxCode.Trim();
        user.CourtOwner.UpdatedAt = DateTime.UtcNow;

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var errors = string.Join("; ", updateResult.Errors.Select(e => e.Description));
            return Result.Failure(new BadError(errors));
        }

        await dbContext.SaveChangesAsync(ct);
        return Result.Success();
    }
}
