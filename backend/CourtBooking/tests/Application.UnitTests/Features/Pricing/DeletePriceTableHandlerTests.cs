using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.DeletePriceTable;
using CourtBooking.Domain.Events;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Pricing;

public sealed class DeletePriceTableHandlerTests : BaseHandlerTest
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

        var handler = new DeletePriceTableHandler(context, _branchAuth, _publisher);
        var command = new DeletePriceTableCommand(branchId, tableId);

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

        var handler = new DeletePriceTableHandler(context, _branchAuth, _publisher);
        var command = new DeletePriceTableCommand(branchId, tableId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenPriceTableBelongsToDifferentBranch_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId1 = Guid.CreateVersion7();
        var branchId2 = Guid.CreateVersion7();

        var table = new PriceTableBuilder().Build();
        var courtType = new CourtTypeBuilder()
            .WithBranchId(branchId2)
            .WithPriceTable(table)
            .Build();

        context.CourtTypes.Add(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId1, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new DeletePriceTableHandler(context, _branchAuth, _publisher);
        var command = new DeletePriceTableCommand(branchId1, table.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenDeletingLastPriceTableOfCourtType_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var singleTable = new PriceTableBuilder().Build();
        var courtType = new CourtTypeBuilder()
            .WithBranchId(branchId)
            .WithPriceTable(singleTable)
            .Build();

        context.CourtTypes.Add(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new DeletePriceTableHandler(context, _branchAuth, _publisher);
        var command = new DeletePriceTableCommand(branchId, singleTable.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValidCommand_DeletesPriceTableSuccessfullyAndPublishesEvent()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var tableToDelete = new PriceTableBuilder().WithName("Bảng giá xóa").Build();
        var remainingTable = new PriceTableBuilder().WithName("Bảng giá mặc định").Build();

        var courtType = new CourtTypeBuilder()
            .WithBranchId(branchId)
            .WithPriceTable(tableToDelete)
            .WithPriceTable(remainingTable)
            .Build();

        context.CourtTypes.Add(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new DeletePriceTableHandler(context, _branchAuth, _publisher);
        var command = new DeletePriceTableCommand(branchId, tableToDelete.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        var exists = await context.PriceTables.AnyAsync(pt => pt.Id == tableToDelete.Id);
        Assert.False(exists);

        var remainingExists = await context.PriceTables.AnyAsync(pt => pt.Id == remainingTable.Id);
        Assert.True(remainingExists);

        await _publisher.Received(1).Publish(
            Arg.Is<BranchPriceChangedEvent>(e => e.BranchId == branchId),
            Arg.Any<CancellationToken>());
    }
}
