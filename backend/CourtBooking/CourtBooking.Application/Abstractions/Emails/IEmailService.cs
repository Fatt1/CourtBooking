namespace CourtBooking.Application.Abstractions.Emails;

/// <summary>
/// Dịch vụ gửi email thông báo và xác nhận của hệ thống.
/// </summary>
public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string message, CancellationToken ct = default);

}
