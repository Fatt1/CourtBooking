using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.CourtTypes.Commands.DeleteCourtType;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.CourtTypes;

public sealed class DeleteCourtTypeCommandHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();

    [Fact]
    public async Task Handle_WhenCourtTypeNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new DeleteCourtTypeHandler(context, _branchAuth);
        var command = new DeleteCourtTypeCommand(Guid.NewGuid());

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
        var courtType = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Sân 1", MinutesConfig = 60 };
        await context.CourtTypes.AddAsync(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Không có quyền")));

        var handler = new DeleteCourtTypeHandler(context, _branchAuth);
        var command = new DeleteCourtTypeCommand(courtType.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenHasCourts_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var courtType = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Sân 1", MinutesConfig = 60 };
        await context.CourtTypes.AddAsync(courtType);

        var court = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType.Id, Name = "Sân A", Status = CourtStatus.Available };
        await context.Courts.AddAsync(court);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>()).Returns(Result.Success());

        var handler = new DeleteCourtTypeHandler(context, _branchAuth);
        var command = new DeleteCourtTypeCommand(courtType.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
        Assert.Contains("sân con trực thuộc", result.Error.Message);
    }

    [Fact]
    public async Task Handle_WhenValid_DeletesCourtTypeSuccessfully()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var courtType = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Sân Trống", MinutesConfig = 60 };
        await context.CourtTypes.AddAsync(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>()).Returns(Result.Success());

        var handler = new DeleteCourtTypeHandler(context, _branchAuth);
        var command = new DeleteCourtTypeCommand(courtType.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        var remaining = await context.CourtTypes.FirstOrDefaultAsync(ct => ct.Id == courtType.Id);
        Assert.Null(remaining);
    }
}
