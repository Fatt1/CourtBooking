using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.CreatePriceTable;
using CourtBooking.Domain.Events;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Pricing;

public sealed class CreatePriceTableHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();
    private readonly IPublisher _publisher = Substitute.For<IPublisher>();

    [Fact]
    public async Task Handle_WhenBranchAuthFails_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();
        var courtTypeId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Không có quyền")));

        var handler = new CreatePriceTableHandler(context, _branchAuth, _publisher);
        var command = new CreatePriceTableCommand(branchId, courtTypeId, "Bảng giá mới", 100000m, 120000m, true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenCourtTypeNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();
        var courtTypeId = Guid.CreateVersion7();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreatePriceTableHandler(context, _branchAuth, _publisher);
        var command = new CreatePriceTableCommand(branchId, courtTypeId, "Bảng giá mới", 100000m, 120000m, true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenDuplicateNameInSameCourtType_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var existingTable = new PriceTableBuilder()
            .WithName("Bảng giá tiêu chuẩn")
            .Build();

        var courtType = new CourtTypeBuilder()
            .WithBranchId(branchId)
            .WithPriceTable(existingTable)
            .Build();

        context.CourtTypes.Add(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreatePriceTableHandler(context, _branchAuth, _publisher);
        var command = new CreatePriceTableCommand(branchId, courtType.Id, "bảng giá tiêu chuẩn", 120000m, 140000m, true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValidCommand_CreatesPriceTableAndPublishesEvent()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.CreateVersion7();

        var courtType = new CourtTypeBuilder()
            .WithBranchId(branchId)
            .Build();

        context.CourtTypes.Add(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreatePriceTableHandler(context, _branchAuth, _publisher);
        var command = new CreatePriceTableCommand(branchId, courtType.Id, "Bảng giá cuối tuần", 150000m, 180000m, true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        result.Value.ShouldNotBe(Guid.Empty);

        var created = await context.PriceTables.FirstOrDefaultAsync(pt => pt.Id == result.Value);
        created.ShouldNotBeNull();
        created.Name.ShouldBe("Bảng giá cuối tuần");
        created.DefaultPrice.ShouldBe(150000m);
        created.DefaultWalkInPrice.ShouldBe(180000m);
        created.IsActive.ShouldBeTrue();
        created.CourtTypeId.ShouldBe(courtType.Id);

        await _publisher.Received(1).Publish(
            Arg.Is<BranchPriceChangedEvent>(e => e.BranchId == branchId),
            Arg.Any<CancellationToken>());
    }
}
