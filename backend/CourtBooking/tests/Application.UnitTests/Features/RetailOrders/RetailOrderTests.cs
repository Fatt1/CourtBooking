using CourtBooking.Domain.Entities.Services;

namespace Application.UnitTests.Features.RetailOrders;

public sealed class RetailOrderTests
{
    [Fact]
    public void Create_WithValidParameters_InitializesCorrectProperties()
    {
        // Arrange
        var branchId = Guid.NewGuid();
        var discountAmount = 10_000m;
        var createdAt = new DateTime(2026, 10, 24, 10, 0, 0, DateTimeKind.Utc);

        // Act
        var order = RetailOrder.Create(branchId, discountAmount, createdAt);

        // Assert
        order.Id.ShouldNotBe(Guid.Empty);
        order.BranchId.ShouldBe(branchId);
        order.DiscountAmount.ShouldBe(discountAmount);
        order.CreatedAt.ShouldBe(createdAt);
        order.UpdatedAt.ShouldBe(createdAt);
        order.OrderDate.ShouldBe(DateOnly.FromDateTime(createdAt));
        order.OrderCode.ShouldStartWith("HD-");
        order.Items.ShouldBeEmpty();
    }

    [Fact]
    public void AddItem_WhenAddingSingleItem_CalculatesTotalAmountCorrectly()
    {
        // Arrange
        var order = RetailOrder.Create(Guid.NewGuid(), 5_000m, DateTime.UtcNow);
        var serviceId = Guid.NewGuid();

        // Act
        order.AddItem(serviceId, quantity: 2, unitPrice: 20_000m);

        // Assert
        order.Items.Count.ShouldBe(1);
        var item = order.Items[0];
        item.ServiceId.ShouldBe(serviceId);
        item.Quantity.ShouldBe(2);
        item.UnitPrice.ShouldBe(20_000m);
        order.TotalAmount.ShouldBe(35_000m); // 2 * 20,000 - 5,000
    }

    [Fact]
    public void AddItem_WhenAddingMultipleItems_SumsSubtotalsAndSubtractsDiscount()
    {
        // Arrange
        var order = RetailOrder.Create(Guid.NewGuid(), 10_000m, DateTime.UtcNow);
        var waterServiceId = Guid.NewGuid();
        var ballServiceId = Guid.NewGuid();

        // Act
        order.AddItem(waterServiceId, quantity: 3, unitPrice: 10_000m); // 30,000
        order.AddItem(ballServiceId, quantity: 2, unitPrice: 50_000m);  // 100,000

        // Assert
        order.Items.Count.ShouldBe(2);
        order.TotalAmount.ShouldBe(120_000m); // 130,000 - 10,000
    }

    [Fact]
    public void AddItem_WhenDiscountIsZero_TotalAmountMatchesSubtotalExactly()
    {
        // Arrange
        var order = RetailOrder.Create(Guid.NewGuid(), 0m, DateTime.UtcNow);
        var serviceId = Guid.NewGuid();

        // Act
        order.AddItem(serviceId, quantity: 4, unitPrice: 15_000m);

        // Assert
        order.TotalAmount.ShouldBe(60_000m);
    }
}
