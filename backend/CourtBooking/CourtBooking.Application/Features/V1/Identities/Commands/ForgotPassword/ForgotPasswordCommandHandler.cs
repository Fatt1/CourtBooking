using System.Text;
using CourtBooking.Application.Abstractions.Emails;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Application.Features.V1.Identities.Commands.ForgotPassword;

internal sealed class ForgotPasswordCommandHandler(
    UserManager<ApplicationUser> userManager,
    ILogger<ForgotPasswordCommandHandler> logger,
    IEmailService emailService) : ICommandHandler<ForgotPasswordCommand>
{
    public async Task<Result> Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        // 1. Tìm người dùng theo Email và ExpectedAccountType (nếu có tách biệt cổng Chủ sân vs Người chơi)
        var query = userManager.Users
            .Where(u => u.Email == request.Email && !u.IsDeleted);

        if (request.ExpectedAccountType.HasValue)
        {
            query = query.Where(u => u.AccountType == request.ExpectedAccountType.Value);
        }

        var user = await query.FirstOrDefaultAsync(ct);

        // Chuẩn bảo mật OWASP: Luôn trả về thành công để tránh dò quét email (enumeration attack)
        if (user is null || user.Status != UserStatus.Active)
        {
            return Result.Success();
        }

        // 2. Sinh Password Reset Token qua ASP.NET Identity
        var token = await userManager.GeneratePasswordResetTokenAsync(user);

        // 3. Chuyển token sang chuỗi Base64 URL-safe để chèn an toàn vào URL
        var tokenBytes = Encoding.UTF8.GetBytes(token);
        var urlSafeToken = WebEncoders.Base64UrlEncode(tokenBytes);

        // 4. Xây dựng đường link đặt lại mật khẩu riêng biệt cho từng portal (Chủ sân vs Người chơi)
        string defaultUrl = (user.AccountType == AccountType.CourtOwner)
            ? "http://localhost:3000/owner/reset-password"
            : "http://localhost:3000/reset-password";

        var baseUrl = defaultUrl;

        logger.LogInformation("ForgotPassword: Sending reset link to {Email} for account type {AccountType}. Reset URL: {ResetUrl}",
            user.Email, user.AccountType, baseUrl);

        var resetLink = $"{baseUrl}?email={Uri.EscapeDataString(user.Email!)}&token={urlSafeToken}";

        // 5. Gửi email
        await emailService.SendEmailAsync(user.Email!, resetLink, ct);

        return Result.Success();
    }
}
