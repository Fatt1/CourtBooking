using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Entities.Payments;
using CourtBooking.Domain.Enums;

namespace Application.UnitTests.Common.Builders;

public sealed class OrderBuilder
{
    private Guid _id = Guid.NewGuid();
    private string _orderCode = "ORD-TEST-001";
    private Guid _branchId = Guid.NewGuid();
    private Guid? _playerId;
    private string _customerName = "Nguyen Van Test";
    private string _customerPhone = "0901234567";
    private string? _note;
    private OrderStatus _status = OrderStatus.AwaitingPayment;
    private readonly OrderChannel _channel = OrderChannel.Online;
    private readonly OrderType _type = OrderType.Normal;
    private DateOnly _orderDate = DateOnly.FromDateTime(DateTime.UtcNow);
    private decimal _totalCourtAmount;
    private decimal _totalServiceAmount;
    private decimal _discountAmount;
    private string? _cancelReason;
    private DateTime _holdExpiresAt = DateTime.UtcNow.AddMinutes(15);
    private readonly DateTime _createdAt = DateTime.UtcNow;
    private readonly DateTime _updatedAt = DateTime.UtcNow;

    private readonly List<OrderDetail> _details = [];
    private readonly List<OrderService> _services = [];
    private readonly List<PaymentTransaction> _transactions = [];

    public OrderBuilder WithId(Guid id)
    {
        _id = id;
        return this;
    }

    public OrderBuilder WithOrderCode(string orderCode)
    {
        _orderCode = orderCode;
        return this;
    }

    public OrderBuilder WithBranchId(Guid branchId)
    {
        _branchId = branchId;
        return this;
    }

    public OrderBuilder WithPlayerId(Guid? playerId)
    {
        _playerId = playerId;
        return this;
    }

    public OrderBuilder WithCustomer(string name, string phone)
    {
        _customerName = name;
        _customerPhone = phone;
        return this;
    }

    public OrderBuilder WithNote(string? note)
    {
        _note = note;
        return this;
    }

    public OrderBuilder WithStatus(OrderStatus status)
    {
        _status = status;
        return this;
    }

    public OrderBuilder WithCancelReason(string? reason)
    {
        _cancelReason = reason;
        return this;
    }

    public OrderBuilder WithHoldExpiresAt(DateTime expiresAt)
    {
        _holdExpiresAt = expiresAt;
        return this;
    }

    public OrderBuilder WithCourtAmount(decimal amount)
    {
        _totalCourtAmount = amount;
        return this;
    }

    public OrderBuilder WithServiceAmount(decimal amount)
    {
        _totalServiceAmount = amount;
        return this;
    }

    public OrderBuilder WithDiscountAmount(decimal amount)
    {
        _discountAmount = amount;
        return this;
    }

    public OrderBuilder WithOrderDate(DateOnly date)
    {
        _orderDate = date;
        return this;
    }

    public OrderBuilder WithDetail(Guid courtId, DateOnly date, TimeOnly startTime, TimeOnly endTime, decimal price, Court? court = null)
    {
        _details.Add(new OrderDetail
        {
            Id = Guid.NewGuid(),
            OrderId = _id,
            CourtId = courtId,
            Court = court!,
            Date = date,
            StartTime = startTime,
            EndTime = endTime,
            Price = price
        });
        return this;
    }

    public OrderBuilder WithService(Guid serviceId, decimal unitPrice, int quantity)
    {
        _services.Add(new OrderService
        {
            Id = Guid.NewGuid(),
            OrderId = _id,
            ServiceId = serviceId,
            UnitPrice = unitPrice,
            Quantity = quantity
        });
        return this;
    }

    public OrderBuilder WithPayment(decimal amount, PaymentMethod method = PaymentMethod.QrTransfer, PaymentTransactionType type = PaymentTransactionType.Payment)
    {
        _transactions.Add(new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            OrderId = _id,
            Amount = amount,
            Method = method,
            Type = type,
            CreatedAt = DateTime.UtcNow
        });
        return this;
    }

    public Order Build()
    {
        var order = new Order
        {
            Id = _id,
            OrderCode = _orderCode,
            BranchId = _branchId,
            PlayerId = _playerId,
            CustomerName = _customerName,
            CustomerPhone = _customerPhone,
            Note = _note,
            Status = _status,
            Channel = _channel,
            OrderType = _type,
            OrderDate = _orderDate,
            TotalCourtAmount = _totalCourtAmount,
            TotalServiceAmount = _totalServiceAmount,
            DiscountAmount = _discountAmount,
            CancelReason = _cancelReason,
            HoldExpiresAt = _holdExpiresAt,
            CreatedAt = _createdAt,
            UpdatedAt = _updatedAt
        };

        foreach (var detail in _details)
        {
            detail.OrderId = _id;
            order.Details.Add(detail);
        }

        foreach (var service in _services)
        {
            service.OrderId = _id;
            order.Services.Add(service);
        }

        foreach (var transaction in _transactions)
        {
            transaction.OrderId = _id;
            order.PaymentTransactions.Add(transaction);
        }

        return order;
    }
}
