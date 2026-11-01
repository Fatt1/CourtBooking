using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Courts.Queries.GetCourtsByBranch;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;

namespace Application.UnitTests.Features.Courts;

public sealed class GetCourtsByBranchHandlerTests : BaseHandlerTest
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

        var handler = new GetCourtsByBranchHandler(context, _branchAuth);
        var query = new GetCourtsByBranchQuery(branchId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValid_ReturnsCourtsOfBranchFilteredByStatus()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var branchId = Guid.NewGuid();
        var branch = new BranchBuilder().WithId(branchId).Build();
        var courtType = new CourtType { Id = Guid.NewGuid(), BranchId = branchId, Branch = branch, Name = "Loại 1", MinutesConfig = 60 };
        var courtAvailable = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType.Id, CourtType = courtType, Name = "Sân 1", Status = CourtStatus.Available };
        var courtMaintenance = new Court { Id = Guid.NewGuid(), CourtTypeId = courtType.Id, CourtType = courtType, Name = "Sân 2", Status = CourtStatus.Maintenance };

        await context.Branches.AddAsync(branch);
        await context.CourtTypes.AddAsync(courtType);
        await context.Courts.AddRangeAsync(courtAvailable, courtMaintenance);
        await context.SaveChangesAsync();

        _branchAuth.EnsureOwnerAsync(branchId, Arg.Any<CancellationToken>()).Returns(Result.Success());

        var handler = new GetCourtsByBranchHandler(context, _branchAuth);
        var query = new GetCourtsByBranchQuery(branchId, Status: CourtStatus.Available);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Single(result.Value);
        Assert.Equal(courtAvailable.Id, result.Value[0].Id);
    }
}
