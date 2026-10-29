using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranches;
using CourtBooking.SharedKernel;

namespace Application.UnitTests.Features.Branches;

public sealed class GetOwnerBranchesHandlerTests : BaseHandlerTest
{
    private readonly IUserContext _userContext = Substitute.For<IUserContext>();

    [Fact]
    public async Task Handle_WhenOwnerHasBranches_ReturnsOnlyBranchesOfCurrentOwner()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var currentOwnerId = Guid.NewGuid();
        var otherOwnerId = Guid.NewGuid();
        _userContext.UserId.Returns(currentOwnerId);

        var myBranch1 = new BranchBuilder().WithCourtOwnerId(currentOwnerId).WithName("Chi nhánh A").Build();
        var myBranch2 = new BranchBuilder().WithCourtOwnerId(currentOwnerId).WithName("Chi nhánh B").Build();
        var otherBranch = new BranchBuilder().WithCourtOwnerId(otherOwnerId).WithName("Chi nhánh C").Build();

        await context.Branches.AddRangeAsync(myBranch1, myBranch2, otherBranch);
        await context.SaveChangesAsync();

        var handler = new GetOwnerBranchesHandler(context, _userContext);
        var query = new GetOwnerBranchesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Count);
        Assert.Contains(result.Value, b => b.Id == myBranch1.Id);
        Assert.Contains(result.Value, b => b.Id == myBranch2.Id);
        Assert.DoesNotContain(result.Value, b => b.Id == otherBranch.Id);
    }

    [Fact]
    public async Task Handle_WhenOwnerHasNoBranches_ReturnsEmptyList()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        _userContext.UserId.Returns(Guid.NewGuid());

        var handler = new GetOwnerBranchesHandler(context, _userContext);
        var query = new GetOwnerBranchesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value);
    }
}
