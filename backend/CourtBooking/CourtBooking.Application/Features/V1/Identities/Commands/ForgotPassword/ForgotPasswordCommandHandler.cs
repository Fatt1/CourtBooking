using System.Text;
using CourtBooking.Application.Abstractions.Emails;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;

namespace CourtBooking.Application.Features.V1.Identities.Commands.ForgotPassword;

internal sealed class ForgotPasswordCommandHandler(
    UserManager<ApplicationUser> userManager,
    IEmailService emailService) : ICommandHandler<ForgotPasswordCommand>
{
    public async Task<Result> Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        var user = await userManager.FindByEmailAsync(request.Email);

        // Chuẩn bảo mật OWASP: Luôn trả về thành công để tránh dò quét email (enumeration attack)
        if (user is null || user.IsDeleted || user.Status != UserStatus.Active)
        {
            return Result.Success();
        }

        // 1. Sinh Password Reset Token qua ASP.NET Identity
        var token = await userManager.GeneratePasswordResetTokenAsync(user);

        // 2. Chuyển token sang chuỗi Base64 URL-safe để chèn an toàn vào URL
        var tokenBytes = Encoding.UTF8.GetBytes(token);
        var urlSafeToken = Convert.ToBase64String(tokenBytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

        // 3. Xây dựng đường link đặt lại mật khẩu gửi cho người dùng
        var baseUrl = !string.IsNullOrWhiteSpace(request.ClientResetUrl)
            ? request.ClientResetUrl.TrimEnd('/')
            : "http://localhost:3000/reset-password";

        var resetLink = $"{baseUrl}?email={Uri.EscapeDataString(user.Email!)}&token={urlSafeToken}";

        // 4. Gửi email
        await emailService.SendPasswordResetEmailAsync(user.Email!, resetLink, ct);

        return Result.Success();
    }
}
