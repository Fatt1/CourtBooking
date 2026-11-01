using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.Branches.Commands.CreateBranch;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Entities.Users;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Branches;

public sealed class CreateBranchCommandHandlerTests : BaseHandlerTest
{
    private readonly IUserContext _userContext = Substitute.For<IUserContext>();
    private readonly IPublisher _publisher = Substitute.For<IPublisher>();

    private static CreateBranchCommand CreateSampleCommand(Guid sportTypeId) =>
        new(
            Name: "Chi nhánh Quận 1",
            Hotline: "0901234567",
            Province: "TP.HCM",
            District: "Quận 1",
            Street: "123 Lê Lợi",
            MapUrl: "https://maps.google.com/?q=10.7769,106.7009",
            OpenTime: new TimeOnly(6, 0),
            CloseTime: new TimeOnly(22, 0),
            QrImageId: Guid.NewGuid(),
            AccountNumber: "1234567890",
            AccountName: "NGUYEN VAN A",
            SportTypeIds: [sportTypeId],
            Policy: "Quy định đặt cọc",
            Latitude: 10.7769m,
            Longitude: 106.7009m,
            ImageIds: [Guid.NewGuid()]
        );

    [Fact]
    public async Task Handle_WhenUserIsNotCourtOwner_ReturnsForbidden()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var userId = Guid.NewGuid();
        _userContext.UserId.Returns(userId);

        var handler = new CreateBranchHandler(context, _userContext, _publisher);
        var command = CreateSampleCommand(Guid.NewGuid());

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

        await context.CourtOwners.AddAsync(new CourtOwner
        {
            Id = ownerId,
            BusinessName = "Chủ sân ABC",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var nonExistentSportId = Guid.NewGuid();
        var handler = new CreateBranchHandler(context, _userContext, _publisher);
        var command = CreateSampleCommand(nonExistentSportId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsFailure);
        Assert.IsType<NotFoundError>(result.Error);
    }

    [Fact]
    public async Task Handle_WhenValid_CreatesBranchAndPublishesAttachImagesEvent()
    {
        // Arrange
        await using TestDbContext context = CreateDbContext();
        var ownerId = Guid.NewGuid();
        _userContext.UserId.Returns(ownerId);

        await context.CourtOwners.AddAsync(new CourtOwner
        {
            Id = ownerId,
            BusinessName = "Chủ sân ABC",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        var sport = new SportType { Id = Guid.NewGuid(), Name = "Cầu lông" };
        await context.SportTypes.AddAsync(sport);
        await context.SaveChangesAsync();

        var handler = new CreateBranchHandler(context, _userContext, _publisher);
        var command = CreateSampleCommand(sport.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        var branchId = result.Value;
        Assert.NotEqual(Guid.Empty, branchId);

        var savedBranch = await context.Branches
            .Include(b => b.BranchSportTypes)
            .FirstOrDefaultAsync(b => b.Id == branchId);

        Assert.NotNull(savedBranch);
        Assert.Equal("Chi nhánh Quận 1", savedBranch.Name);
        Assert.Equal(ownerId, savedBranch.CourtOwnerId);
        Assert.True(savedBranch.IsActive);
        Assert.Single(savedBranch.BranchSportTypes);
        Assert.Equal(sport.Id, savedBranch.BranchSportTypes[0].SportTypeId);

        await _publisher.Received(1).Publish(Arg.Any<AttachImagesEvent>(), Arg.Any<CancellationToken>());
    }
}
