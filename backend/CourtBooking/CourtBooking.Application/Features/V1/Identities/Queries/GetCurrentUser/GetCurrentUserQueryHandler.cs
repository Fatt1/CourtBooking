using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Identities.Queries.GetCurrentUser;

internal sealed class GetCurrentUserQueryHandler(
    UserManager<ApplicationUser> userManager,
    IUserContext userContext) : IQueryHandler<GetCurrentUserQuery, CurrentUserDto>
{
    public async Task<Result<CurrentUserDto>> Handle(GetCurrentUserQuery request, CancellationToken ct)
    {
        var userId = userContext.UserId;
        var user = await userManager.Users
            .Include(u => u.CourtOwner)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, ct);

        if (user is null)
        {
            return Result.Failure<CurrentUserDto>(new NotFoundError("User", userId));
        }

        var roles = await userManager.GetRolesAsync(user);
        var primaryRole = roles.FirstOrDefault() ?? user.AccountType.ToString();

        return Result.Success(new CurrentUserDto(
            user.Id,
            user.Email ?? string.Empty,
            user.FullName,
            user.PhoneNumber,
            primaryRole,
            user.AccountType.ToString(),
            user.CourtOwner?.BusinessName,
            user.CourtOwner?.MustChangePwd));
    }
}
