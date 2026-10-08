using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Users.Commands.RestoreUser;

internal sealed class RestoreUserCommandHandler(
    IApplicationDbContext dbContext) : ICommandHandler<RestoreUserCommand>
{
    public async Task<Result> Handle(RestoreUserCommand request, CancellationToken ct)
    {
        var user = await dbContext.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct);

        if (user is null)
        {
            return Result.Failure(new NotFoundError("User", request.UserId));
        }

        if (!user.IsDeleted)
        {
            return Result.Failure(new BadError("Tài khoản này hiện không trong trạng thái bị xóa mềm."));
        }

        user.IsDeleted = false;
        user.Status = UserStatus.Active;
        user.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        return Result.Success();
    }
}
