using CourtBooking.Application.Abstractions.Emails;
using Microsoft.Extensions.Logging;

namespace CourtBooking.Infrastructure.Emails;

public sealed class SmtpmailService(ILogger<SmtpmailService> logger) : IEmailService
{
    public Task SendEmailAsync(string toEmail, string message, CancellationToken ct = default)
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
            message);
        return Task.CompletedTask;
    }


}
