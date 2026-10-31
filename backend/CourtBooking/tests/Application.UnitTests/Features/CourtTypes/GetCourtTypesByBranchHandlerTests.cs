using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.CourtTypes.Queries.GetCourtTypesByBranch;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;

namespace Application.UnitTests.Features.CourtTypes;

public sealed class GetCourtTypesByBranchHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();

    [Fact]
    public async Task Handle_WhenBranchAuthFails_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Không có quyền")));

        var handler = new GetCourtTypesByBranchHandler(context, _branchAuth);
        var query = new GetCourtTypesByBranchQuery(branchId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValid_ReturnsCourtTypesForBranch()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var otherBranchId = Guid.NewGuid();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>()).Returns(Result.Success());

        var ct1 = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Loại A", MinutesConfig = 60 };
        var ct2 = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Name = "Loại B", MinutesConfig = 90 };
        var ctOther = new CourtType { Id = Guid.NewGuid(), BranchId = otherBranchId, Name = "Loại C", MinutesConfig = 60 };

        await context.CourtTypes.AddRangeAsync(ct1, ct2, ctOther);
        await context.SaveChangesAsync();

        var handler = new GetCourtTypesByBranchHandler(context, _branchAuth);
        var query = new GetCourtTypesByBranchQuery(branchId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Count);
        Assert.Contains(result.Value, x => x.Id == ct1.Id);
        Assert.Contains(result.Value, x => x.Id == ct2.Id);
        Assert.DoesNotContain(result.Value, x => x.Id == ctOther.Id);
    }
}
