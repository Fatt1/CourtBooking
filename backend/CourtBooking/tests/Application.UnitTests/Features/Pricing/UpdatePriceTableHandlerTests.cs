using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.UpdatePriceTable;
using CourtBooking.Domain.Events;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Pricing;

public sealed class UpdatePriceTableHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();
    private readonly IPublisher _publisher = Substitute.For<IPublisher>();

    [Fact]
    public async Task Handle_WhenBranchAuthFails_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();
        var tableId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Không có quyền")));

        var handler = new UpdatePriceTableHandler(context, _branchAuth, _publisher);
        var command = new UpdatePriceTableCommand(branchId, tableId, "Tên mới", 100000m, 120000m, true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenPriceTableNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();
        var tableId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdatePriceTableHandler(context, _branchAuth, _publisher);
        var command = new UpdatePriceTableCommand(branchId, tableId, "Tên mới", 100000m, 120000m, true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenDuplicateNameWithAnotherTableInSameCourtType_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var table1 = new PriceTableBuilder().WithName("Bảng giá sáng").Build();
        var table2 = new PriceTableBuilder().WithName("Bảng giá chiều").Build();

        var courtType = new CourtTypeBuilder()
            .WithBranchId(branchId)
            .WithPriceTable(table1)
            .WithPriceTable(table2)
            .Build();

        context.CourtTypes.Add(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdatePriceTableHandler(context, _branchAuth, _publisher);
        // Rename table1 to "Bảng giá chiều" (conflicts with table2)
        var command = new UpdatePriceTableCommand(branchId, table1.Id, "Bảng giá chiều", 110000m, 130000m, true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValidCommand_UpdatesPriceTableSuccessfullyAndPublishesEvent()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var table = new PriceTableBuilder()
            .WithName("Bảng giá cũ")
            .WithDefaultPrice(80000m)
            .WithActive(true)
            .Build();

        var courtType = new CourtTypeBuilder()
            .WithBranchId(branchId)
            .WithPriceTable(table)
            .Build();

        context.CourtTypes.Add(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdatePriceTableHandler(context, _branchAuth, _publisher);
        var command = new UpdatePriceTableCommand(branchId, table.Id, "Bảng giá mới đã sửa", 95000m, 115000m, false);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        var updated = await context.PriceTables.FirstOrDefaultAsync(pt => pt.Id == table.Id);
        updated.ShouldNotBeNull();
        updated.Name.ShouldBe("Bảng giá mới đã sửa");
        updated.DefaultPrice.ShouldBe(95000m);
        updated.DefaultWalkInPrice.ShouldBe(115000m);
        updated.IsActive.ShouldBeFalse();

        await _publisher.Received(1).Publish(
            Arg.Is<BranchPriceChangedEvent>(e => e.BranchId == branchId),
            Arg.Any<CancellationToken>());
    }
}
