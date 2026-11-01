using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Courts.Commands.DeleteCourt;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Orders;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Courts;

public sealed class DeleteCourtCommandHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();

    [Fact]
    public async Task Handle_WhenCourtNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new DeleteCourtHandler(context, _branchAuth);
        var command = new DeleteCourtCommand(Guid.NewGuid());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenCourtHasOrderHistory_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var courtType = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Loại 1", MinutesConfig = 60 };
        var court = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType.Id, Name = "Sân 1", Status = CourtStatus.Available };
        await context.CourtTypes.AddAsync(courtType);
        await context.Courts.AddAsync(court);

        var orderDetail = new OrderDetail
        {
            Id = Guid.NewGuid(),
            OrderId = Guid.NewGuid(),
            CourtId = court.Id,
            Date = DateOnly.FromDateTime(DateTime.UtcNow),
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(9, 0),
            Price = 100000m
        };
        await context.OrderDetails.AddAsync(orderDetail);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>()).Returns(Result.Success());

        var handler = new DeleteCourtHandler(context, _branchAuth);
        var command = new DeleteCourtCommand(court.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
        Assert.Contains("lịch sử đặt sân", result.Error.Message);
    }

    [Fact]
    public async Task Handle_WhenValid_DeletesCourtSuccessfully()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var courtType = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Loại 1", MinutesConfig = 60 };
        var court = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType.Id, Name = "Sân Trống", Status = CourtStatus.Available };
        await context.CourtTypes.AddAsync(courtType);
        await context.Courts.AddAsync(court);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>()).Returns(Result.Success());

        var handler = new DeleteCourtHandler(context, _branchAuth);
        var command = new DeleteCourtCommand(court.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        var remaining = await context.Courts.FirstOrDefaultAsync(c => c.Id == court.Id);
        Assert.Null(remaining);
    }
}
