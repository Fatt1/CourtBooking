using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Identities.Commands.ChangePassword;

internal sealed class ChangePasswordCommandHandler(
    UserManager<ApplicationUser> userManager,
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<ChangePasswordCommand>
{
    public async Task<Result> Handle(ChangePasswordCommand request, CancellationToken ct)
    {
        var userId = userContext.UserId;
        var user = await userManager.Users
            .Include(u => u.CourtOwner)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, ct);

        if (user is null)
        {
            return Result.Failure(new NotFoundError("User", userId));
        }

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return Result.Failure(new BadError(errors));
        }

        // Tự động tắt cờ MustChangePwd nếu là Chủ sân (theo SRS mục 1.1)
        if (user.CourtOwner is not null && user.CourtOwner.MustChangePwd)
        {
            user.CourtOwner.MustChangePwd = false;
            await dbContext.SaveChangesAsync(ct);
        }

        return Result.Success();
    }
}
