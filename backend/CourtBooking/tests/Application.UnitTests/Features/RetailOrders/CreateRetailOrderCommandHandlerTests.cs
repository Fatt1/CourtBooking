using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.RetailOrders.Commands.CreateRetailOrder;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.RetailOrders;

public sealed class CreateRetailOrderCommandHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();

    [Fact]
    public async Task Handle_WhenBranchAuthorizationFails_ReturnsAuthorizationError()
    {
        // Arrange
        await using var context = CreateDbContext();
        var branchId = Guid.NewGuid();
        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Bạn không có quyền quản lý chi nhánh này.")));

        var handler = new CreateRetailOrderHandler(context, _branchAuth);
        var command = new CreateRetailOrderCommand(
            branchId,
            0m,
            [new CreateRetailOrderItem(Guid.NewGuid(), 1)]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ForbiddenError>();
    }

    [Fact]
    public async Task Handle_WhenItemsListIsEmpty_ReturnsBadError()
    {
        // Arrange
        await using var context = CreateDbContext();
        var branchId = Guid.NewGuid();
        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateRetailOrderHandler(context, _branchAuth);
        var command = new CreateRetailOrderCommand(branchId, 0m, []);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<BadError>();
        result.Error.Message.ShouldBe("Đơn hàng phải có ít nhất một dịch vụ.");
    }

    [Fact]
    public async Task Handle_WhenDuplicateServicesInRequest_ReturnsBadError()
    {
        // Arrange
        await using var context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var serviceId = Guid.NewGuid();
        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateRetailOrderHandler(context, _branchAuth);
        var command = new CreateRetailOrderCommand(
            branchId,
            0m,
            [
                new CreateRetailOrderItem(serviceId, 1),
                new CreateRetailOrderItem(serviceId, 2)
            ]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<BadError>();
        result.Error.Message.ShouldBe("Mỗi dịch vụ chỉ được xuất hiện một lần trong đơn hàng.");
    }

    [Fact]
    public async Task Handle_WhenServiceNotAvailableAtBranch_ReturnsBadError()
    {
        // Arrange
        await using var context = CreateDbContext();
        var branchId = Guid.NewGuid();
        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateRetailOrderHandler(context, _branchAuth);
        var command = new CreateRetailOrderCommand(
            branchId,
            0m,
            [new CreateRetailOrderItem(Guid.NewGuid(), 1)]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<BadError>();
        result.Error.Message.ShouldBe("Một hoặc nhiều dịch vụ không tồn tại, không hoạt động hoặc chưa được bán tại chi nhánh này.");
    }

    [Fact]
    public async Task Handle_WhenDiscountAmountGreaterThanSubtotal_ReturnsBadError()
    {
        // Arrange
        await using var context = CreateDbContext();
        var branch = new BranchBuilder()
            .WithName("Chi nhánh Quận 1")
            .Build();
        var category = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = branch.CourtOwnerId,
            Name = "Đồ uống",
            IsActive = true
        };
        var service = new Service
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Category = category,
            Name = "Nước suối",
            Unit = "Chai"
        };
        var serviceBranch = new ServiceBranch
        {
            ServiceId = service.Id,
            Service = service,
            BranchId = branch.Id,
            Branch = branch,
            Price = 10_000m,
            IsActive = true
        };

        context.Branches.Add(branch);
        context.ServiceCategories.Add(category);
        context.Services.Add(service);
        context.ServiceBranches.Add(serviceBranch);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branch.Id, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateRetailOrderHandler(context, _branchAuth);
        var command = new CreateRetailOrderCommand(
            branch.Id,
            DiscountAmount: 30_000m, // Subtotal is 20,000 (2 x 10,000), discount 30,000 > subtotal
            Items: [new CreateRetailOrderItem(service.Id, 2)]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<BadError>();
        result.Error.Message.ShouldBe("Tiền giảm giá không được lớn hơn tiền hàng.");
    }

    [Fact]
    public async Task Handle_WhenValidRequest_CreatesRetailOrderAndPersistsToDatabase()
    {
        // Arrange
        await using var context = CreateDbContext();
        var branch = new BranchBuilder()
            .WithName("Chi nhánh Thủ Đức")
            .Build();
        var category = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = branch.CourtOwnerId,
            Name = "Nước giải khát",
            IsActive = true
        };
        var water = new Service
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Category = category,
            Name = "Nước Revive",
            Unit = "Chai"
        };
        var snack = new Service
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Category = category,
            Name = "Bánh Snack",
            Unit = "Gói"
        };
        var waterBranch = new ServiceBranch
        {
            ServiceId = water.Id,
            Service = water,
            BranchId = branch.Id,
            Branch = branch,
            Price = 15_000m,
            IsActive = true
        };
        var snackBranch = new ServiceBranch
        {
            ServiceId = snack.Id,
            Service = snack,
            BranchId = branch.Id,
            Branch = branch,
            Price = 20_000m,
            IsActive = true
        };

        context.Branches.Add(branch);
        context.ServiceCategories.Add(category);
        context.Services.AddRange(water, snack);
        context.ServiceBranches.AddRange(waterBranch, snackBranch);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branch.Id, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateRetailOrderHandler(context, _branchAuth);
        var command = new CreateRetailOrderCommand(
            branch.Id,
            DiscountAmount: 5_000m,
            Items: [
                new CreateRetailOrderItem(water.Id, 2),  // 30,000
                new CreateRetailOrderItem(snack.Id, 1)   // 20,000 -> subtotal = 50,000
            ]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var dto = result.Value;
        dto.BranchId.ShouldBe(branch.Id);
        dto.BranchName.ShouldBe(branch.Name);
        dto.Subtotal.ShouldBe(50_000m);
        dto.DiscountAmount.ShouldBe(5_000m);
        dto.TotalAmount.ShouldBe(45_000m);
        dto.Items.Count.ShouldBe(2);

        // Verify database persistence
        var persistedOrder = await context.RetailOrders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == dto.Id);
        persistedOrder.ShouldNotBeNull();
        persistedOrder.TotalAmount.ShouldBe(45_000m);
        persistedOrder.Items.Count.ShouldBe(2);
    }
}
