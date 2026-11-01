using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Courts.Commands.UpdateCourt;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Courts;

public sealed class UpdateCourtCommandHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();

    [Fact]
    public async Task Handle_WhenCourtNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new UpdateCourtHandler(context, _branchAuth);
        var command = new UpdateCourtCommand(Guid.NewGuid(), null, "Sân Mới", CourtStatus.Available);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenBranchAuthFails_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var courtType = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Loại 1", MinutesConfig = 60 };
        var court = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType.Id, Name = "Sân 1", Status = CourtStatus.Available };
        await context.CourtTypes.AddAsync(courtType);
        await context.Courts.AddAsync(court);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Không có quyền")));

        var handler = new UpdateCourtHandler(context, _branchAuth);
        var command = new UpdateCourtCommand(court.Id, null, "Sân 1 Đổi Tên", CourtStatus.Maintenance);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValid_UpdatesCourtDetails()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var courtType = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Loại 1", MinutesConfig = 60 };
        var court = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType.Id, Name = "Sân 1", Status = CourtStatus.Available };
        await context.CourtTypes.AddAsync(courtType);
        await context.Courts.AddAsync(court);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>()).Returns(Result.Success());

        var handler = new UpdateCourtHandler(context, _branchAuth);
        var command = new UpdateCourtCommand(court.Id, null, "Sân 1 Đã Đổi Tên", CourtStatus.Maintenance);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        var updated = await context.Courts.FirstOrDefaultAsync(c => c.Id == court.Id);
        Assert.NotNull(updated);
        Assert.Equal("Sân 1 Đã Đổi Tên", updated.Name);
        Assert.Equal(CourtStatus.Maintenance, updated.Status);
    }
}
