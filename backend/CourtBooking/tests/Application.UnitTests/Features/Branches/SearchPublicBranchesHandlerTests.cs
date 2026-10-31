using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Features.V1.Branches.Queries.SearchPublicBranches;
using CourtBooking.Domain.Entities.Courts;

namespace Application.UnitTests.Features.Branches;

public sealed class SearchPublicBranchesHandlerTests : BaseHandlerTest
{
    [Fact]
    public async Task Handle_WhenNoBranchesMatch_ReturnsEmptyPagedList()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new SearchPublicBranchesHandler(context);
        var query = new SearchPublicBranchesQuery(Search: "Tên Không Hề Tồn Tại");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value.Items);
        Assert.Equal(0, result.Value.TotalCount);
    }

    [Fact]
    public async Task Handle_WhenInactiveBranchesExist_ExcludesInactiveBranches()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var activeBranch = new BranchBuilder().WithName("Sân Hoạt Động").WithActive(true).Build();
        var inactiveBranch = new BranchBuilder().WithName("Sân Tạm Dừng").WithActive(false).Build();

        await context.Branches.AddRangeAsync(activeBranch, inactiveBranch);
        await context.SaveChangesAsync();

        var handler = new SearchPublicBranchesHandler(context);
        var query = new SearchPublicBranchesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Single(result.Value.Items);
        Assert.Equal(activeBranch.Id, result.Value.Items[0].Id);
    }

    [Fact]
    public async Task Handle_WhenFilterBySportType_ReturnsOnlyMatchingBranches()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var sportBadminton = new SportType { Id = Guid.NewGuid(), Name = "Cầu lông" };
        var sportTennis = new SportType { Id = Guid.NewGuid(), Name = "Tennis" };
        await context.SportTypes.AddRangeAsync(sportBadminton, sportTennis);

        var branch1 = new BranchBuilder().WithName("Sân Cầu Lông").WithActive(true).Build();
        branch1.BranchSportTypes.Add(new BranchSportType { BranchId = branch1.Id, SportTypeId = sportBadminton.Id });

        var branch2 = new BranchBuilder().WithName("Sân Tennis").WithActive(true).Build();
        branch2.BranchSportTypes.Add(new BranchSportType { BranchId = branch2.Id, SportTypeId = sportTennis.Id });

        await context.Branches.AddRangeAsync(branch1, branch2);
        await context.SaveChangesAsync();

        var handler = new SearchPublicBranchesHandler(context);
        var query = new SearchPublicBranchesQuery(SportTypeIds: [sportBadminton.Id]);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Single(result.Value.Items);
        Assert.Equal(branch1.Id, result.Value.Items[0].Id);
    }
}
