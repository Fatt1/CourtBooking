using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules;
using CourtBooking.Domain.Entities.Courts;

namespace Application.UnitTests.Features.Pricing;

public sealed class PriceTableRuleOverlapCheckerTests
{
    private static PriceTableRule CreateRule(
        TimeOnly start,
        TimeOnly end,
        byte dayFrom = 1,
        byte dayTo = 5,
        DateOnly? startDate = null,
        DateOnly? endDate = null,
        Guid? id = null) => new()
    {
        Id = id ?? Guid.CreateVersion7(),
        PriceTableId = Guid.CreateVersion7(),
        StartDate = startDate,
        EndDate = endDate,
        DayOfWeekFrom = dayFrom,
        DayOfWeekTo = dayTo,
        StartTime = start,
        EndTime = end,
        FixedCustomerPrice = 80000m,
        WalkInCustomerPrice = 100000m
    };

    [Fact]
    public void HasOverlap_WhenNoExistingRules_ReturnsFalse()
    {
        // Arrange
        var rules = new List<PriceTableRule>();

        // Act
        var result = PriceTableRuleOverlapChecker.HasOverlap(
            rules,
            null,
            null,
            1,
            5,
            new TimeOnly(8, 0),
            new TimeOnly(12, 0));

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void HasOverlap_WhenTimeDoesNotOverlap_ReturnsFalse()
    {
        // Arrange (Existing rule: 08:00 - 12:00)
        var rules = new List<PriceTableRule>
        {
            CreateRule(new TimeOnly(8, 0), new TimeOnly(12, 0))
        };

        // Act (New rule: 12:00 - 17:00, exactly adjacent)
        var result = PriceTableRuleOverlapChecker.HasOverlap(
            rules,
            null,
            null,
            1,
            5,
            new TimeOnly(12, 0),
            new TimeOnly(17, 0));

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void HasOverlap_WhenDaysOfWeekDoNotOverlap_ReturnsFalse()
    {
        // Arrange (Existing rule: Mon-Fri, 17:00 - 21:00)
        var rules = new List<PriceTableRule>
        {
            CreateRule(new TimeOnly(17, 0), new TimeOnly(21, 0), dayFrom: 1, dayTo: 5)
        };

        // Act (New rule: Sat-Sun, 17:00 - 21:00, same hours but weekend)
        var result = PriceTableRuleOverlapChecker.HasOverlap(
            rules,
            null,
            null,
            6,
            0,
            new TimeOnly(17, 0),
            new TimeOnly(21, 0));

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void HasOverlap_WhenDateRangesDoNotOverlap_ReturnsFalse()
    {
        // Arrange (Existing rule: Jan 2026)
        var rules = new List<PriceTableRule>
        {
            CreateRule(
                new TimeOnly(8, 0),
                new TimeOnly(12, 0),
                startDate: new DateOnly(2026, 1, 1),
                endDate: new DateOnly(2026, 1, 31))
        };

        // Act (New rule: Feb 2026, same time and days)
        var result = PriceTableRuleOverlapChecker.HasOverlap(
            rules,
            new DateOnly(2026, 2, 1),
            new DateOnly(2026, 2, 28),
            1,
            5,
            new TimeOnly(8, 0),
            new TimeOnly(12, 0));

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void HasOverlap_WhenTimeAndDaysAndDatesOverlap_ReturnsTrue()
    {
        // Arrange (Existing rule: 08:00 - 12:00 Mon-Fri)
        var rules = new List<PriceTableRule>
        {
            CreateRule(new TimeOnly(8, 0), new TimeOnly(12, 0), dayFrom: 1, dayTo: 5)
        };

        // Act (New rule: 10:00 - 14:00 Mon-Fri, overlaps 10:00 - 12:00)
        var result = PriceTableRuleOverlapChecker.HasOverlap(
            rules,
            null,
            null,
            1,
            5,
            new TimeOnly(10, 0),
            new TimeOnly(14, 0));

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void HasOverlap_WhenRulesHaveNullDateRanges_TreatsAsIndefiniteAndDetectsOverlap()
    {
        // Arrange (Both have null date range => all year)
        var rules = new List<PriceTableRule>
        {
            CreateRule(new TimeOnly(18, 0), new TimeOnly(22, 0), dayFrom: 1, dayTo: 5, startDate: null, endDate: null)
        };

        // Act
        var result = PriceTableRuleOverlapChecker.HasOverlap(
            rules,
            null,
            null,
            1,
            5,
            new TimeOnly(19, 0),
            new TimeOnly(21, 0));

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void HasOverlap_WhenUpdatingSameRule_IgnoresSelfAndReturnsFalse()
    {
        // Arrange
        var ruleId = Guid.CreateVersion7();
        var rules = new List<PriceTableRule>
        {
            CreateRule(new TimeOnly(8, 0), new TimeOnly(12, 0), dayFrom: 1, dayTo: 5, id: ruleId)
        };

        // Act (Updating self with same or adjusted times)
        var result = PriceTableRuleOverlapChecker.HasOverlap(
            rules,
            null,
            null,
            1,
            5,
            new TimeOnly(8, 30),
            new TimeOnly(11, 30),
            ignoreRuleId: ruleId);

        // Assert
        Assert.False(result);
    }
}
