using Microsoft.AspNetCore.Identity;

namespace CourtBooking.Domain.Entities.Users;

/// <summary>
/// Role của hệ thống - kế thừa ASP.NET Identity.
/// </summary>
public class ApplicationRole : IdentityRole<Guid>
{
    public ApplicationRole() { }

    public string? Description { get; set; }
}
