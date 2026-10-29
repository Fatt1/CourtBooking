using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Branches.Queries.GetOwnerBranchById;
using CourtBooking.SharedKernel;

namespace Application.UnitTests.Features.Branches;

public sealed class GetOwnerBranchByIdHandlerTests : BaseHandlerTest
{
    private readonly IUserContext _userContext = Substitute.For<IUserContext>();

    [Fact]
    public async Task Handle_WhenBranchNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        _userContext.UserId.Returns(Guid.NewGuid());

        var handler = new GetOwnerBranchByIdHandler(context, _userContext);
        var query = new GetOwnerBranchByIdQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenBranchBelongsToAnotherOwner_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        _userContext.UserId.Returns(otherUserId);

        var branch = new BranchBuilder().WithCourtOwnerId(ownerId).Build();
        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var handler = new GetOwnerBranchByIdHandler(context, _userContext);
        var query = new GetOwnerBranchByIdQuery(branch.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenFound_ReturnsOwnerBranchDetailWithFallbackMapUrl()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerId = Guid.NewGuid();
        _userContext.UserId.Returns(ownerId);

        var branch = new BranchBuilder()
            .WithCourtOwnerId(ownerId)
            .WithName("Sân Cầu Lông Tân Bình")
            .WithCoordinates(10.7900m, 106.6500m)
            .WithMapUrl(null)
            .Build();
        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var handler = new GetOwnerBranchByIdHandler(context, _userContext);
        var query = new GetOwnerBranchByIdQuery(branch.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(branch.Id, result.Value.Id);
        Assert.Equal("Sân Cầu Lông Tân Bình", result.Value.Name);
        Assert.Equal($"https://www.google.com/maps?q={branch.Latitude},{branch.Longitude}", result.Value.MapUrl);
    }
}
