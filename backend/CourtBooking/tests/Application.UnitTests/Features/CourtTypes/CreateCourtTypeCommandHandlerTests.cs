using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.CourtTypes.Commands.CreateCourtType;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.CourtTypes;

public sealed class CreateCourtTypeCommandHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();

    [Fact]
    public async Task Handle_WhenBranchAuthFails_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Không có quyền quản lý chi nhánh này.")));

        var handler = new CreateCourtTypeHandler(context, _branchAuth);
        var command = new CreateCourtTypeCommand(branchId, "Sân 5 người", 60);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenNameAlreadyExistsInBranch_ReturnsConflict()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        await context.CourtTypes.AddAsync(new CourtType
        {
            Id = Guid.NewGuid(),
            BranchId = branchId,
            Name = "Sân 5 người",
            MinutesConfig = 60
        });
        await context.SaveChangesAsync();

        var handler = new CreateCourtTypeHandler(context, _branchAuth);
        var command = new CreateCourtTypeCommand(branchId, "  Sân 5 người  ", 60);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ConflictError>(result.Error);
        Assert.Contains("đã tồn tại", result.Error.Message);
    }

    [Fact]
    public async Task Handle_WhenValid_CreatesCourtTypeSuccessfully()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateCourtTypeHandler(context, _branchAuth);
        var command = new CreateCourtTypeCommand(branchId, "Sân Cầu Lông Đôi", 60);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotEqual(Guid.Empty, result.Value);

        var created = await context.CourtTypes.FirstOrDefaultAsync(ct => ct.Id == result.Value);
        Assert.NotNull(created);
        Assert.Equal("Sân Cầu Lông Đôi", created.Name);
        Assert.Equal(60, created.MinutesConfig);
        Assert.Equal(branchId, created.BranchId);
    }
}
