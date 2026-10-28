using CourtBooking.Application.Features.V1.Pricing.Dtos;
using CourtBooking.Application.Helpers;

namespace Application.UnitTests.Features.Pricing;

public sealed class DaysOfWeekMaskHelperTests
{
    [Theory]
    [InlineData(new int[] { 1, 3, 5 }, 42)] // Thứ 2, 4, 6 => 2 + 8 + 32 = 42
    [InlineData(new int[] { 0, 6 }, 65)]    // Chủ nhật, Thứ 7 => 1 + 64 = 65
    [InlineData(new int[] { 0, 1, 2, 3, 4, 5, 6 }, 127)] // Cả tuần => 127
    [InlineData(new int[] { }, 0)]
    [InlineData(new int[] { 99, -1 }, 0)]   // Ngày không hợp lệ bị bỏ qua
    public void ComputeMask_WhenGivenDaysOfWeek_ReturnsCorrectBitmask(int[] days, int expectedMask)
    {
        // Act
        var mask = DaysOfWeekMaskHelper.ComputeMask(days);

        // Assert
        Assert.Equal(expectedMask, mask);
    }

    [Theory]
    [InlineData(42, new int[] { 1, 3, 5 })]
    [InlineData(65, new int[] { 0, 6 })]
    [InlineData(127, new int[] { 0, 1, 2, 3, 4, 5, 6 })]
    [InlineData(0, new int[] { })]
    public void DecodeMask_WhenGivenBitmask_ReturnsCorrectDays(int mask, int[] expectedDays)
    {
        // Act
        var days = DaysOfWeekMaskHelper.DecodeMask(mask);

        // Assert
        Assert.Equal(expectedDays, days);
    }

    [Fact]
    public void DecodeMaskToNames_WhenGivenMask42_ReturnsCorrectVietnameseDayNames()
    {
        // Act (42 = Thứ 2, 4, 6)
        var names = DaysOfWeekMaskHelper.DecodeMaskToNames(42);

        // Assert
        names.ShouldBe(["T2", "T4", "T6"]);
    }

    [Fact]
    public void DecodeMaskToNames_WhenGivenMask1_ReturnsSunday()
    {
        // Act
        var names = DaysOfWeekMaskHelper.DecodeMaskToNames(1);

        // Assert
        names.ShouldBe(["CN"]);
    }

    [Theory]
    [InlineData(0, "CN")]
    [InlineData(1, "T2")]
    [InlineData(5, "T6")]
    [InlineData(6, "T7")]
    public void GetDayName_WhenGivenDayNumber_ReturnsMatchingVietnameseString(int day, string expectedName)
    {
        // Act
        var name = DaysOfWeekMaskHelper.GetDayName(day);

        // Assert
        Assert.Equal(expectedName, name);
    }

    [Fact]
    public void GetDayRangeText_WhenSameDay_ReturnsSingleDayName()
    {
        // Act
        var rangeText = DaysOfWeekMaskHelper.GetDayRangeText(1, 1);

        // Assert
        Assert.Equal("T2", rangeText);
    }

    [Fact]
    public void GetDayRangeText_WhenDifferentDays_ReturnsRangeString()
    {
        // Act
        var rangeText = DaysOfWeekMaskHelper.GetDayRangeText(1, 5);

        // Assert
        Assert.Equal("T2 - T6", rangeText);
    }

    [Fact]
    public void GetDayRangeText_WhenFullWeek_ReturnsWholeWeekString()
    {
        // Act
        var rangeText = DaysOfWeekMaskHelper.GetDayRangeText(0, 6);

        // Assert
        Assert.Equal("T2 - CN", rangeText);
    }

    [Theory]
    // Dải bình thường (From <= To)
    [InlineData(1, 1, 5, true)]  // Thứ 2 nằm trong T2-T6
    [InlineData(3, 1, 5, true)]  // Thứ 4 nằm trong T2-T6
    [InlineData(5, 1, 5, true)]  // Thứ 6 nằm trong T2-T6
    [InlineData(0, 1, 5, false)] // Chủ nhật không nằm trong T2-T6
    [InlineData(6, 1, 5, false)] // Thứ 7 không nằm trong T2-T6
    // Dải vắt qua tuần (From > To, ví dụ T7 đến T2)
    [InlineData(6, 6, 1, true)]  // Thứ 7 nằm trong T7-T2
    [InlineData(0, 6, 1, true)]  // Chủ nhật nằm trong T7-T2
    [InlineData(1, 6, 1, true)]  // Thứ 2 nằm trong T7-T2
    [InlineData(2, 6, 1, false)] // Thứ 3 không nằm trong T7-T2
    [InlineData(5, 6, 1, false)] // Thứ 6 không nằm trong T7-T2
    public void IsDayMatching_MatchesCorrectly(byte day, byte from, byte to, bool expected)
    {
        // Act
        var result = DaysOfWeekMaskHelper.IsDayMatching(day, from, to);

        // Assert
        Assert.Equal(expected, result);
    }
}
