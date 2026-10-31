using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.CourtTypes.Commands.UpdateCourtType;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.CourtTypes;

public sealed class UpdateCourtTypeCommandHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();

    [Fact]
    public async Task Handle_WhenCourtTypeNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new UpdateCourtTypeHandler(context, _branchAuth);
        var command = new UpdateCourtTypeCommand(Guid.NewGuid(), "Sân mới", 60);

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
        var courtType = new CourtType
        {
            Id = Guid.NewGuid(),
            BranchId = branchId,
            Name = "Sân Cũ",
            MinutesConfig = 60
        };
        await context.CourtTypes.AddAsync(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Không có quyền")));

        var handler = new UpdateCourtTypeHandler(context, _branchAuth);
        var command = new UpdateCourtTypeCommand(courtType.Id, "Sân Mới", 60);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenDuplicateNameInSameBranch_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var courtType1 = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Sân 1", MinutesConfig = 60 };
        var courtType2 = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Sân 2", MinutesConfig = 60 };
        await context.CourtTypes.AddRangeAsync(courtType1, courtType2);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>()).Returns(Result.Success());

        var handler = new UpdateCourtTypeHandler(context, _branchAuth);
        // Cố đổi tên courtType1 thành "Sân 2"
        var command = new UpdateCourtTypeCommand(courtType1.Id, "Sân 2", 60);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValid_UpdatesCourtTypeSuccessfully()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var courtType = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Sân Cũ", MinutesConfig = 60 };
        await context.CourtTypes.AddAsync(courtType);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>()).Returns(Result.Success());

        var handler = new UpdateCourtTypeHandler(context, _branchAuth);
        var command = new UpdateCourtTypeCommand(courtType.Id, "Sân Đã Đổi Tên", 90);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        var updated = await context.CourtTypes.FirstOrDefaultAsync(ct => ct.Id == courtType.Id);
        Assert.NotNull(updated);
        Assert.Equal("Sân Đã Đổi Tên", updated.Name);
        Assert.Equal(90, updated.MinutesConfig);
    }
}
