using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Courts.Commands.CreateCourt;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Courts;

public sealed class CreateCourtCommandHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();

    [Fact]
    public async Task Handle_WhenCourtTypeNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new CreateCourtHandler(context, _branchAuth);
        var command = new CreateCourtCommand(Guid.NewGuid(), "Sân 1");

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
        var courtType = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Sân VIP", MinutesConfig = 60 };
        await context.CourtTypes.AddAsync(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Không có quyền")));

        var handler = new CreateCourtHandler(context, _branchAuth);
        var command = new CreateCourtCommand(courtType.Id, "Sân 1");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenCourtNameAlreadyExistsInCourtType_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var courtType = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Sân VIP", MinutesConfig = 60 };
        await context.CourtTypes.AddAsync(courtType);

        var existingCourt = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType.Id, Name = "Sân 1", Status = CourtStatus.Available };
        await context.Courts.AddAsync(existingCourt);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>()).Returns(Result.Success());

        var handler = new CreateCourtHandler(context, _branchAuth);
        var command = new CreateCourtCommand(courtType.Id, "  Sân 1  ");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValid_CreatesCourtSuccessfully()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var courtType = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Sân VIP", MinutesConfig = 60 };
        await context.CourtTypes.AddAsync(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>()).Returns(Result.Success());

        var handler = new CreateCourtHandler(context, _branchAuth);
        var command = new CreateCourtCommand(courtType.Id, "Sân 2");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotEqual(Guid.Empty, result.Value);

        var court = await context.Courts.FirstOrDefaultAsync(c => c.Id == result.Value);
        Assert.NotNull(court);
        Assert.Equal("Sân 2", court.Name);
        Assert.Equal(CourtStatus.Available, court.Status);
        Assert.Equal(courtType.Id, court.CourtTypeId);
    }
}
