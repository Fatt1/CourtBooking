using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;

namespace CourtBooking.Application.Features.V1.Identities.Commands.UnlinkExternalLogin;

internal sealed class UnlinkExternalLoginCommandHandler(
    UserManager<ApplicationUser> userManager,
    IUserContext userContext) : ICommandHandler<UnlinkExternalLoginCommand>
{
    public async Task<Result> Handle(UnlinkExternalLoginCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = userContext.UserId;
        var user = await userManager.FindByIdAsync(currentUserId.ToString());
        if (user is null)
        {
            return Result.Failure(new NotFoundError(nameof(ApplicationUser), currentUserId));
        }

        var logins = await userManager.GetLoginsAsync(user);
        var targetLogin = logins.FirstOrDefault(l =>
            string.Equals(l.LoginProvider, request.Provider, StringComparison.OrdinalIgnoreCase));

        if (targetLogin is null)
        {
            return Result.Failure(new BadError($"Tài khoản chưa được liên kết với '{request.Provider}'."));
        }

        // Kiểm tra an toàn: nếu tài khoản không có mật khẩu và chỉ có duy nhất 1 liên kết này thì không cho hủy
        var hasPassword = !string.IsNullOrEmpty(user.PasswordHash);
        if (!hasPassword && logins.Count <= 1)
        {
            return Result.Failure(new BadError("Bạn chưa thiết lập mật khẩu và đây là phương thức đăng nhập duy nhất. Hãy tạo mật khẩu trước khi hủy liên kết."));
        }

        var removeResult = await userManager.RemoveLoginAsync(user, targetLogin.LoginProvider, targetLogin.ProviderKey);
        if (!removeResult.Succeeded)
        {
            var errors = string.Join("; ", removeResult.Errors.Select(e => e.Description));
            return Result.Failure(new BadError($"Hủy liên kết thất bại: {errors}"));
        }

        return Result.Success();
    }
}
