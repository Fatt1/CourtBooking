using Application.UnitTests.Common.Abstractions;
using Application.UnitTests.Common.Builders;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Branches.Commands.UpdateBranch;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Branches;

public sealed class UpdateBranchCommandHandlerTests : BaseHandlerTest
{
    private readonly IUserContext _userContext = Substitute.For<IUserContext>();
    private readonly IPublisher _publisher = Substitute.For<IPublisher>();

    private static UpdateBranchCommand CreateSampleCommand(Guid branchId, Guid sportTypeId, Guid qrImageId) =>
        new(
            Id: branchId,
            Name: "Chi nhánh Cập Nhật",
            Hotline: "0909999999",
            Province: "TP.HCM",
            District: "Quận 3",
            Street: "456 Võ Văn Tần",
            MapUrl: "https://maps.google.com/?q=10.7780,106.6900",
            OpenTime: new TimeOnly(5, 30),
            CloseTime: new TimeOnly(23, 0),
            QrImageId: qrImageId,
            AccountNumber: "9876543210",
            AccountName: "NGUYEN VAN B",
            SportTypeIds: [sportTypeId],
            Policy: "Chính sách mới",
            Latitude: 10.7780m,
            Longitude: 106.6900m,
            ImageIds: []
        );

    [Fact]
    public async Task Handle_WhenBranchNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        _userContext.UserId.Returns(Guid.NewGuid());

        var handler = new UpdateBranchHandler(context, _userContext, _publisher);
        var command = CreateSampleCommand(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenBranchNotOwnedByUser_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        _userContext.UserId.Returns(otherUserId);

        var branch = new BranchBuilder()
            .WithCourtOwnerId(ownerId)
            .Build();
        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var handler = new UpdateBranchHandler(context, _userContext, _publisher);
        var command = CreateSampleCommand(branch.Id, Guid.NewGuid(), branch.QrImageId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<ForbiddenError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenSportTypeNotFound_ReturnsNotFound()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerId = Guid.NewGuid();
        _userContext.UserId.Returns(ownerId);

        var branch = new BranchBuilder()
            .WithCourtOwnerId(ownerId)
            .Build();
        await context.Branches.AddAsync(branch);
        await context.SaveChangesAsync();

        var nonExistentSportId = Guid.NewGuid();
        var handler = new UpdateBranchHandler(context, _userContext, _publisher);
        var command = CreateSampleCommand(branch.Id, nonExistentSportId, branch.QrImageId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValid_UpdatesBranchAndPublishesEvents()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerId = Guid.NewGuid();
        _userContext.UserId.Returns(ownerId);

        var branch = new BranchBuilder()
            .WithCourtOwnerId(ownerId)
            .Build();
        await context.Branches.AddAsync(branch);

        var sport = new SportType { Id = Guid.NewGuid(), Name = "Pickleball" };
        await context.SportTypes.AddAsync(sport);
        await context.SaveChangesAsync();

        var newQrImageId = Guid.NewGuid();
        var handler = new UpdateBranchHandler(context, _userContext, _publisher);
        var command = CreateSampleCommand(branch.Id, sport.Id, newQrImageId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);

        var updated = await context.Branches
            .Include(b => b.BranchSportTypes)
            .FirstOrDefaultAsync(b => b.Id == branch.Id);

        Assert.NotNull(updated);
        Assert.Equal("Chi nhánh Cập Nhật", updated.Name);
        Assert.Equal("0909999999", updated.Hotline);
        Assert.Equal("TP.HCM", updated.Province);
        Assert.Equal("Quận 3", updated.District);
        Assert.Equal("456 Võ Văn Tần", updated.Street);
        Assert.Equal(newQrImageId, updated.QrImageId);
        Assert.Single(updated.BranchSportTypes);
        Assert.Equal(sport.Id, updated.BranchSportTypes[0].SportTypeId);

        await _publisher.Received(1).Publish(Arg.Any<AttachImagesEvent>(), Arg.Any<CancellationToken>());
    }
}
