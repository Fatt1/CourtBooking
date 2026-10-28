using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.UpdatePriceTableRule;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Events;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Pricing;

public sealed class UpdatePriceTableRuleHandlerTests : BaseHandlerTest
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
        var ruleId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Không có quyền")));

        var handler = new UpdatePriceTableRuleHandler(context, _branchAuth, _publisher);
        var command = new UpdatePriceTableRuleCommand(
            branchId, tableId, ruleId, null, null, 1, 5, new TimeOnly(8, 0), new TimeOnly(12, 0), 80000m, 100000m);

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
        var ruleId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdatePriceTableRuleHandler(context, _branchAuth, _publisher);
        var command = new UpdatePriceTableRuleCommand(
            branchId, tableId, ruleId, null, null, 1, 5, new TimeOnly(8, 0), new TimeOnly(12, 0), 80000m, 100000m);

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
        var ownerBranchId = Guid.CreateVersion7();
        var otherBranchId = Guid.CreateVersion7();
        var ruleId = Guid.CreateVersion7();

        var branch = new BranchBuilder().WithId(otherBranchId).Build();
        var courtType = new CourtTypeBuilder().WithBranchId(otherBranchId).Build();
        var priceTable = new PriceTableBuilder().WithCourtTypeId(courtType.Id).Build();

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.PriceTables.AddAsync(priceTable);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(ownerBranchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdatePriceTableRuleHandler(context, _branchAuth, _publisher);
        var command = new UpdatePriceTableRuleCommand(
            ownerBranchId, priceTable.Id, ruleId, null, null, 1, 5, new TimeOnly(8, 0), new TimeOnly(12, 0), 80000m, 100000m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenRuleNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();
        var nonExistentRuleId = Guid.CreateVersion7();

        var branch = new BranchBuilder().WithId(branchId).Build();
        var courtType = new CourtTypeBuilder().WithBranchId(branchId).Build();
        var priceTable = new PriceTableBuilder().WithCourtTypeId(courtType.Id).Build();

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.PriceTables.AddAsync(priceTable);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdatePriceTableRuleHandler(context, _branchAuth, _publisher);
        var command = new UpdatePriceTableRuleCommand(
            branchId, priceTable.Id, nonExistentRuleId, null, null, 1, 5, new TimeOnly(8, 0), new TimeOnly(12, 0), 80000m, 100000m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenOverlapWithAnotherRuleInSamePriceTable_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var branch = new BranchBuilder().WithId(branchId).Build();
        var courtType = new CourtTypeBuilder().WithBranchId(branchId).Build();
        var priceTable = new PriceTableBuilder().WithCourtTypeId(courtType.Id).Build();

        var ruleToUpdate = new PriceTableRule
        {
            Id = Guid.CreateVersion7(),
            PriceTableId = priceTable.Id,
            DayOfWeekFrom = 1,
            DayOfWeekTo = 5,
            StartTime = new TimeOnly(6, 0),
            EndTime = new TimeOnly(8, 0),
            FixedCustomerPrice = 60000m,
            WalkInCustomerPrice = 80000m
        };

        var anotherExistingRule = new PriceTableRule
        {
            Id = Guid.CreateVersion7(),
            PriceTableId = priceTable.Id,
            DayOfWeekFrom = 1,
            DayOfWeekTo = 5,
            StartTime = new TimeOnly(17, 0),
            EndTime = new TimeOnly(21, 0),
            FixedCustomerPrice = 120000m,
            WalkInCustomerPrice = 150000m
        };

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.PriceTables.AddAsync(priceTable);
        await context.PriceTableRules.AddRangeAsync(ruleToUpdate, anotherExistingRule);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdatePriceTableRuleHandler(context, _branchAuth, _publisher);
        // Try updating ruleToUpdate to overlap with anotherExistingRule (e.g. 18:00 - 20:00 on weekdays)
        var command = new UpdatePriceTableRuleCommand(
            branchId,
            priceTable.Id,
            ruleToUpdate.Id,
            null,
            null,
            1,
            5,
            new TimeOnly(18, 0),
            new TimeOnly(20, 0),
            130000m,
            160000m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValidCommand_UpdatesRuleAndPublishesBranchPriceChangedEvent()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var branch = new BranchBuilder().WithId(branchId).Build();
        var courtType = new CourtTypeBuilder().WithBranchId(branchId).Build();
        var priceTable = new PriceTableBuilder().WithCourtTypeId(courtType.Id).Build();

        var ruleToUpdate = new PriceTableRule
        {
            Id = Guid.CreateVersion7(),
            PriceTableId = priceTable.Id,
            DayOfWeekFrom = 1,
            DayOfWeekTo = 5,
            StartTime = new TimeOnly(6, 0),
            EndTime = new TimeOnly(8, 0),
            FixedCustomerPrice = 60000m,
            WalkInCustomerPrice = 80000m
        };

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.PriceTables.AddAsync(priceTable);
        await context.PriceTableRules.AddAsync(ruleToUpdate);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new UpdatePriceTableRuleHandler(context, _branchAuth, _publisher);
        var newStartTime = new TimeOnly(7, 0);
        var newEndTime = new TimeOnly(9, 30);
        var command = new UpdatePriceTableRuleCommand(
            branchId,
            priceTable.Id,
            ruleToUpdate.Id,
            new DateOnly(2026, 6, 1),
            new DateOnly(2026, 8, 31),
            1,
            6,
            newStartTime,
            newEndTime,
            95000m,
            120000m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        var updatedRule = await context.PriceTableRules.FirstOrDefaultAsync(r => r.Id == ruleToUpdate.Id);
        Assert.NotNull(updatedRule);
        Assert.Equal(newStartTime, updatedRule.StartTime);
        Assert.Equal(newEndTime, updatedRule.EndTime);
        Assert.Equal(95000m, updatedRule.FixedCustomerPrice);
        Assert.Equal(120000m, updatedRule.WalkInCustomerPrice);
        Assert.Equal((byte)6, updatedRule.DayOfWeekTo);
        Assert.Equal(new DateOnly(2026, 6, 1), updatedRule.StartDate);
        Assert.Equal(new DateOnly(2026, 8, 31), updatedRule.EndDate);

        await _publisher.Received(1).Publish(
            Arg.Is<BranchPriceChangedEvent>(e => e.BranchId == branchId),
            Arg.Any<CancellationToken>());
    }
}
