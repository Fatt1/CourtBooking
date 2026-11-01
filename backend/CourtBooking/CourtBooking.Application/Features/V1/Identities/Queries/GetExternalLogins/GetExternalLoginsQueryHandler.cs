using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Identities.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;

namespace CourtBooking.Application.Features.V1.Identities.Queries.GetExternalLogins;

internal sealed class GetExternalLoginsQueryHandler(
    UserManager<ApplicationUser> userManager,
    IUserContext userContext) : IQueryHandler<GetExternalLoginsQuery, IReadOnlyList<UserExternalLoginDto>>
{
    public async Task<Result<IReadOnlyList<UserExternalLoginDto>>> Handle(GetExternalLoginsQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = userContext.UserId;
        var user = await userManager.FindByIdAsync(currentUserId.ToString());
        if (user is null)
        {
            return Result.Failure<IReadOnlyList<UserExternalLoginDto>>(new NotFoundError(nameof(ApplicationUser), currentUserId));
        }

        var logins = await userManager.GetLoginsAsync(user);

        IReadOnlyList<UserExternalLoginDto> result = logins
            .Select(l => new UserExternalLoginDto(l.LoginProvider, l.ProviderDisplayName ?? l.LoginProvider))
            .ToList();

        return Result.Success(result);
    }
}
