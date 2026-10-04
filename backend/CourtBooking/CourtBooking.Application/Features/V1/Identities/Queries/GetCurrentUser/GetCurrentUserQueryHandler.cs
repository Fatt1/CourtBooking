using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Identities.Queries.GetCurrentUser;

internal sealed class GetCurrentUserQueryHandler(
    UserManager<ApplicationUser> userManager,
    IUserContext userContext) : IQueryHandler<GetCurrentUserQuery, CurrentPlayerDto>
{
    public async Task<Result<CurrentPlayerDto>> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var userId = userContext.UserId;
        var user = await userManager.Users
            .Include(u => u.PlayerProfile)
                .ThenInclude(p => p!.AvatarImage)
            .Include(u => u.CourtOwner)
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);

        if (user is null)
        {
            return Result.Failure<CurrentPlayerDto>(new NotFoundError("User", userId));
        }

        var profile = user.PlayerProfile;

        return Result.Success(new CurrentPlayerDto(
            user.Id,
            user.Email ?? string.Empty,
            user.FullName,
            user.PhoneNumber ?? string.Empty,
            profile?.AvatarImageId,
            profile?.AvatarImage?.StorageKey,
            profile?.Gender ?? Gender.Other,
            profile?.DateOfBirth));
    }
}
