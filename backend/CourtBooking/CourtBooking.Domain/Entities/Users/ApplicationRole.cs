using Microsoft.AspNetCore.Identity;

namespace CourtBooking.Domain.Entities.Users;

/// <summary>
/// Role của hệ thống - kế thừa ASP.NET Identity.
/// </summary>
public class ApplicationRole : IdentityRole<Guid>
{
    private ApplicationRole() { } // EF Core

    public string? Description { get; private set; }

    public static ApplicationRole Create(string roleName, string? description = null)
    {
        return new ApplicationRole
        {
            Id = Guid.NewGuid(),
            Name = roleName,
            NormalizedName = roleName.ToUpperInvariant(),
            Description = description
        };
    }
}
