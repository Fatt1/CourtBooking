using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTableRules.CreatePriceTableRule;
using CourtBooking.Domain.Events;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Pricing;

public sealed class CreatePriceTableRuleHandlerTests : BaseHandlerTest
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

        var handler = new CreatePriceTableRuleHandler(context, _branchAuth, _publisher);
        var command = new CreatePriceTableRuleCommand(
            branchId, tableId, null, null, 1, 5, new TimeOnly(8, 0), new TimeOnly(12, 0), 80000m, 100000m);

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

        var handler = new CreatePriceTableRuleHandler(context, _branchAuth, _publisher);
        var command = new CreatePriceTableRuleCommand(
            branchId, tableId, null, null, 1, 5, new TimeOnly(8, 0), new TimeOnly(12, 0), 80000m, 100000m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenRuleTimeOverlapsWithExistingRule_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var existingTable = new PriceTableBuilder()
            .WithRule(new TimeOnly(8, 0), new TimeOnly(12, 0), dayFrom: 1, dayTo: 5)
            .Build();

        var courtType = new CourtTypeBuilder()
            .WithBranchId(branchId)
            .WithPriceTable(existingTable)
            .Build();

        context.CourtTypes.Add(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreatePriceTableRuleHandler(context, _branchAuth, _publisher);
        // Overlaps 10:00 - 14:00 with existing 08:00 - 12:00
        var command = new CreatePriceTableRuleCommand(
            branchId, existingTable.Id, null, null, 1, 5, new TimeOnly(10, 0), new TimeOnly(14, 0), 90000m, 110000m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValidCommand_CreatesRuleAndReturnsId()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var existingTable = new PriceTableBuilder().Build();
        var courtType = new CourtTypeBuilder()
            .WithBranchId(branchId)
            .WithPriceTable(existingTable)
            .Build();

        context.CourtTypes.Add(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreatePriceTableRuleHandler(context, _branchAuth, _publisher);
        var command = new CreatePriceTableRuleCommand(
            branchId, existingTable.Id, null, null, 1, 5, new TimeOnly(17, 0), new TimeOnly(21, 0), 120000m, 140000m);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        result.Value.ShouldNotBe(Guid.Empty);

        var createdRule = await context.PriceTableRules.FirstOrDefaultAsync(r => r.Id == result.Value);
        createdRule.ShouldNotBeNull();
        createdRule.PriceTableId.ShouldBe(existingTable.Id);
        createdRule.StartTime.ShouldBe(new TimeOnly(17, 0));
        createdRule.EndTime.ShouldBe(new TimeOnly(21, 0));
        createdRule.FixedCustomerPrice.ShouldBe(120000m);
        createdRule.WalkInCustomerPrice.ShouldBe(140000m);

        await _publisher.Received(1).Publish(
            Arg.Is<BranchPriceChangedEvent>(e => e.BranchId == branchId),
            Arg.Any<CancellationToken>());
    }
}
