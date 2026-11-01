using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Services;

namespace Application.UnitTests.Common.Builders;

public sealed class RetailOrderBuilder
{
    private Guid _id = Guid.CreateVersion7();
    private string _orderCode = "HD-TEST-01";
    private Guid _branchId = Guid.NewGuid();
    private decimal _discountAmount;
    private DateOnly _orderDate = DateOnly.FromDateTime(DateTime.UtcNow);
    private DateTime _createdAt = DateTime.UtcNow;
    private DateTime _updatedAt = DateTime.UtcNow;
    private Branch? _branch;
    private readonly List<RetailOrderItem> _items = [];

    public RetailOrderBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public RetailOrderBuilder WithOrderCode(string orderCode)
    {
        _orderCode = orderCode;
        return this;
    }

    public RetailOrderBuilder WithBranchId(Guid branchId)
    {
        _branchId = branchId;
        return this;
    }

    public RetailOrderBuilder WithBranch(Branch branch)
    {
        _branch = branch;
        _branchId = branch.Id;
        return this;
    }

    public RetailOrderBuilder WithDiscountAmount(decimal discountAmount)
    {
        _discountAmount = discountAmount;
        return this;
    }

    public RetailOrderBuilder WithOrderDate(DateOnly orderDate)
    {
        _orderDate = orderDate;
        return this;
    }

    public RetailOrderBuilder WithCreatedAt(DateTime createdAt)
    {
        _createdAt = createdAt;
        _orderDate = DateOnly.FromDateTime(createdAt);
        _updatedAt = createdAt;
        return this;
    }

    public RetailOrderBuilder WithItem(Guid serviceId, int quantity, decimal unitPrice, Service? service = null)
    {
        _items.Add(new RetailOrderItem
        {
            Id = Guid.CreateVersion7(),
            RetailOrderId = _id,
            ServiceId = serviceId,
            Quantity = quantity,
            UnitPrice = unitPrice,
            Service = service!
        });
        return this;
    }

    public RetailOrder Build()
    {
        decimal subtotal = _items.Sum(item => item.Quantity * item.UnitPrice);
        var order = new RetailOrder
        {
            Id = _id,
            OrderCode = _orderCode,
            BranchId = _branchId,
            DiscountAmount = _discountAmount,
            TotalAmount = Math.Max(0, subtotal - _discountAmount),
            OrderDate = _orderDate,
            CreatedAt = _createdAt,
            UpdatedAt = _updatedAt,
            Items = [.. _items]
        };

        if (_branch is not null)
        {
            order.Branch = _branch;
        }

        foreach (var item in order.Items)
        {
            item.RetailOrderId = order.Id;
            item.RetailOrder = order;
        }

        return order;
    }
}
