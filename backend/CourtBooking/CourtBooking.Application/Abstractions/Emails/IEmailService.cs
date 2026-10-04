namespace CourtBooking.Application.Abstractions.Emails;

/// <summary>
/// Dịch vụ gửi email thông báo và xác nhận của hệ thống.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Gửi email cho người dùng.
    /// </summary>
    Task SendEmail(string toEmail, string resetLink, CancellationToken ct = default);

    /// <summary>
    /// Alias viết thường sendEmail theo yêu cầu.
    /// </summary>
    Task sendEmail(string toEmail, string resetLink, CancellationToken ct = default)
        => SendEmail(toEmail, resetLink, ct);
}
