using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;

namespace CourtBooking.Application.Features.V1.Identities.Commands.LinkExternalLogin;

internal sealed class LinkExternalLoginCommandHandler(
    UserManager<ApplicationUser> userManager,
    IUserContext userContext,
    IExternalAuthService externalAuthService) : ICommandHandler<LinkExternalLoginCommand>
{
    public async Task<Result> Handle(LinkExternalLoginCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = userContext.UserId;
        var user = await userManager.FindByIdAsync(currentUserId.ToString());
        if (user is null)
        {
            return Result.Failure(new NotFoundError(nameof(ApplicationUser), currentUserId));
        }

        var normalizedProvider = request.Provider.Trim().ToLowerInvariant();
        Result<ExternalAuthUserInfo> verifyResult;

        if (normalizedProvider == "google")
        {
            verifyResult = await externalAuthService.VerifyGoogleTokenAsync(request.Token, cancellationToken);
        }
        else if (normalizedProvider == "facebook")
        {
            verifyResult = await externalAuthService.VerifyFacebookTokenAsync(request.Token, cancellationToken);
        }
        else
        {
            return Result.Failure(new BadError($"Phương thức '{request.Provider}' không được hỗ trợ."));
        }

        if (verifyResult.IsFailure)
        {
            return Result.Failure(verifyResult.Error);
        }

        var externalInfo = verifyResult.Value;

        // Kiểm tra xem tài khoản mạng xã hội này đã được liên kết với user nào khác chưa
        var existingLinkedUser = await userManager.FindByLoginAsync(externalInfo.Provider, externalInfo.ProviderKey);
        if (existingLinkedUser is not null)
        {
            if (existingLinkedUser.Id == user.Id)
            {
                return Result.Failure(new ConflictError($"Tài khoản {externalInfo.Provider} này đã được liên kết với bạn từ trước."));
            }
            return Result.Failure(new ConflictError($"Tài khoản {externalInfo.Provider} này đã được liên kết với một người dùng khác."));
        }

        var addLoginResult = await userManager.AddLoginAsync(user, new UserLoginInfo(externalInfo.Provider, externalInfo.ProviderKey, externalInfo.Provider));
        if (!addLoginResult.Succeeded)
        {
            var errors = string.Join("; ", addLoginResult.Errors.Select(e => e.Description));
            return Result.Failure(new BadError($"Liên kết thất bại: {errors}"));
        }

        return Result.Success();
    }
}
