namespace CourtBooking.Application.Abstractions.Emails;

/// <summary>
/// Dịch vụ gửi email thông báo và xác nhận của hệ thống.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Gửi email chứa đường dẫn đặt lại mật khẩu cho người dùng.
    /// </summary>
    Task SendPasswordResetEmailAsync(string toEmail, string resetLink, CancellationToken ct = default);
}
