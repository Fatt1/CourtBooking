namespace CourtBooking.Application.Helpers;

/// <summary>
/// Helper tính khoảng cách địa lý theo công thức Haversine.
/// </summary>
public static class GeoHelper
{
    private const double EarthRadiusKm = 6371;

    /// <summary>
    /// Tọa độ mặc định: Dinh Độc Lập (135 Nam Kỳ Khởi Nghĩa, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh).
    /// Áp dụng làm mốc vị trí trung tâm khi người dùng không mở định vị GPS.
    /// </summary>
    public const decimal DefaultLatitude = 10.777025818814499m;
    public const decimal DefaultLongitude = 106.69528064231685m;

    /// <summary>
    /// Tính khoảng cách (km) giữa 2 toạ độ GPS, làm tròn 2 chữ số thập phân.
    /// </summary>
    public static double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
            + Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2))
            * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return Math.Round(EarthRadiusKm * c, 2);
    }

    private static double ToRadians(double angle) => Math.PI * angle / 180.0;
}
