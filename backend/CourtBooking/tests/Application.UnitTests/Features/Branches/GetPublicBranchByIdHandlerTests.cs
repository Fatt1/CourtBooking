using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Features.V1.Branches.Queries.GetPublicBranchById;
using CourtBooking.SharedKernel;

namespace Application.UnitTests.Features.Branches;

public sealed class GetPublicBranchByIdHandlerTests : BaseHandlerTest
{
    [Fact]
    public async Task Handle_WhenBranchNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var handler = new GetPublicBranchByIdHandler(context);
        var query = new GetPublicBranchByIdQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenBranchIsInactive_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branch = new BranchBuilder().WithActive(false).Build();
        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var handler = new GetPublicBranchByIdHandler(context);
        var query = new GetPublicBranchByIdQuery(branch.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenBranchIsActive_ReturnsPublicDetailWithCalculatedDistance()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branch = new BranchBuilder()
            .WithActive(true)
            .WithName("Sân Công Khai")
            .WithCoordinates(10.7769m, 106.7009m)
            .Build();
        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var handler = new GetPublicBranchByIdHandler(context);
        // Client ở gần tọa độ chi nhánh
        var query = new GetPublicBranchByIdQuery(branch.Id, 10.7770m, 106.7010m);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(branch.Id, result.Value.Id);
        Assert.Equal("Sân Công Khai", result.Value.Name);
        Assert.NotNull(result.Value.DistanceKm);
        Assert.True(result.Value.DistanceKm < 1.0); // Rất gần, dưới 1 km
    }
}
