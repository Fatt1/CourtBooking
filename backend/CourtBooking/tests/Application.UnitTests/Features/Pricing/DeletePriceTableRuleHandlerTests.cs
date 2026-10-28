using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.DeletePriceTableRule;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Events;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Pricing;

public sealed class DeletePriceTableRuleHandlerTests : BaseHandlerTest
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

        var handler = new DeletePriceTableRuleHandler(context, _branchAuth, _publisher);
        var command = new DeletePriceTableRuleCommand(branchId, tableId, ruleId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenRuleNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();
        var tableId = Guid.CreateVersion7();
        var ruleId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new DeletePriceTableRuleHandler(context, _branchAuth, _publisher);
        var command = new DeletePriceTableRuleCommand(branchId, tableId, ruleId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenRuleBelongsToDifferentBranch_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerBranchId = Guid.CreateVersion7();
        var otherBranchId = Guid.CreateVersion7();

        var branch = new BranchBuilder().WithId(otherBranchId).Build();
        var courtType = new CourtTypeBuilder().WithBranchId(otherBranchId).Build();
        var priceTable = new PriceTableBuilder().WithCourtTypeId(courtType.Id).Build();
        var rule = new PriceTableRule
        {
            Id = Guid.CreateVersion7(),
            PriceTableId = priceTable.Id,
            DayOfWeekFrom = 1,
            DayOfWeekTo = 5,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(12, 0),
            FixedCustomerPrice = 80000m,
            WalkInCustomerPrice = 100000m
        };

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.PriceTables.AddAsync(priceTable);
        await context.PriceTableRules.AddAsync(rule);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(ownerBranchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new DeletePriceTableRuleHandler(context, _branchAuth, _publisher);
        var command = new DeletePriceTableRuleCommand(ownerBranchId, priceTable.Id, rule.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValidCommand_DeletesRuleAndPublishesBranchPriceChangedEvent()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var branch = new BranchBuilder().WithId(branchId).Build();
        var courtType = new CourtTypeBuilder().WithBranchId(branchId).Build();
        var priceTable = new PriceTableBuilder().WithCourtTypeId(courtType.Id).Build();
        var rule = new PriceTableRule
        {
            Id = Guid.CreateVersion7(),
            PriceTableId = priceTable.Id,
            DayOfWeekFrom = 1,
            DayOfWeekTo = 5,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(12, 0),
            FixedCustomerPrice = 80000m,
            WalkInCustomerPrice = 100000m
        };

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.PriceTables.AddAsync(priceTable);
        await context.PriceTableRules.AddAsync(rule);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new DeletePriceTableRuleHandler(context, _branchAuth, _publisher);
        var command = new DeletePriceTableRuleCommand(branchId, priceTable.Id, rule.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        var exists = await context.PriceTableRules.AnyAsync(r => r.Id == rule.Id);
        Assert.False(exists);

        await _publisher.Received(1).Publish(
            Arg.Is<BranchPriceChangedEvent>(e => e.BranchId == branchId),
            Arg.Any<CancellationToken>());
    }
}
