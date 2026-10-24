using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Identities.Queries.CheckPhone;

internal sealed class CheckPhoneQueryHandler(
    UserManager<ApplicationUser> userManager) : IQueryHandler<CheckPhoneQuery, CheckPhoneResponse>
{
    public async Task<Result<CheckPhoneResponse>> Handle(CheckPhoneQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return Result.Failure<CheckPhoneResponse>(new BadError("Số điện thoại không được để trống."));
        }

        var cleaned = request.PhoneNumber.Trim().Replace(" ", "").Replace(".", "").Replace("-", "");
        var altPhone = cleaned;
        if (cleaned.StartsWith("+84"))
        {
            altPhone = "0" + cleaned.Substring(3);
        }
        else if (cleaned.StartsWith("84") && cleaned.Length >= 11)
        {
            altPhone = "0" + cleaned.Substring(2);
        }
        else if (cleaned.StartsWith("0"))
        {
            altPhone = "+84" + cleaned.Substring(1);
        }

        var user = await userManager.Users
            .Where(u => (u.PhoneNumber == cleaned || u.PhoneNumber == altPhone)
                        && u.AccountType == request.AccountType
                        && !u.IsDeleted)
            .Select(u => new { u.FullName, u.PhoneNumber })
            .FirstOrDefaultAsync(cancellationToken);

        if (user is not null)
        {
            return Result.Success(new CheckPhoneResponse(true, user.PhoneNumber, user.FullName));
        }

        return Result.Success(new CheckPhoneResponse(false, cleaned, null));
    }
}
