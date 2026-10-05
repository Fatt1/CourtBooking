using CourtBooking.Domain.Enums;

namespace CourtBooking.Domain.Constants;

/// <summary>
/// Chứa các hằng số tên Role (vai trò) dùng trong hệ thống ASP.NET Identity và Authorization.
/// </summary>
public static class RoleConstants
{
    public const string Admin = "Admin";
    public const string CourtOwner = "CourtOwner";
    public const string Player = "Player";

    public static readonly IReadOnlyList<string> All = [Admin, CourtOwner, Player];

    /// <summary>
    /// Chuyển đổi từ AccountType sang tên Role dạng chuỗi.
    /// </summary>
    public static string FromAccountType(AccountType accountType) => accountType switch
    {
        AccountType.Player => Player,
        AccountType.CourtOwner => CourtOwner,
        AccountType.Admin => Admin,
        _ => accountType.ToString()
    };
}

/// <summary>
/// Alias ngắn gọn cho RoleConstants.
/// </summary>
public static class Roles
{
    public const string Admin = RoleConstants.Admin;
    public const string CourtOwner = RoleConstants.CourtOwner;
    public const string Player = RoleConstants.Player;
}
