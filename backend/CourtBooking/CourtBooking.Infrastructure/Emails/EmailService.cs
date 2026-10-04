using CourtBooking.Application.Abstractions.Emails;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Infrastructure.Emails;

internal sealed class EmailService(ILogger<EmailService> logger) : IEmailService
{
    public Task SendPasswordResetEmailAsync(string toEmail, string resetLink, CancellationToken ct = default)
    {
        // Ghi log chi tiết để hỗ trợ dev/test ngay trên Console & Seq mà không cần cấu hình SMTP thật
        logger.LogInformation(
            """
            ====================== [EMAIL DISPATCHED] ======================
            To: {ToEmail}
            Subject: [CourtBooking] Yêu cầu đặt lại mật khẩu
            Reset Link: {ResetLink}
            ================================================================
            """,
            toEmail,
            resetLink);

        return Task.CompletedTask;
    }
}
