using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Features.V1.Services.Commands.CreateService;
using CourtBooking.Application.Features.V1.Services.Dtos;
using CourtBooking.Application.Features.V1.Storages.Events.AttachImages;
using CourtBooking.Domain.Entities.Images;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.Services;

public sealed class CreateServiceCommandHandlerTests : BaseHandlerTest
{
    private readonly IBranchAuthorizationService _branchAuth = Substitute.For<IBranchAuthorizationService>();
    private readonly IUserContext _userContext = Substitute.For<IUserContext>();
    private readonly IPublisher _publisher = Substitute.For<IPublisher>();

    [Fact]
    public async Task Handle_WhenCategoryDoesNotExistOrInactive_ReturnsNotFoundError()
    {
        // Arrange
        await using var context = CreateDbContext();
        var currentUserId = Guid.NewGuid();
        _userContext.UserId.Returns(currentUserId);

        var handler = new CreateServiceHandler(context, _branchAuth, _userContext, _publisher);
        var command = new CreateServiceCommand(
            CategoryId: Guid.NewGuid(),
            Name: "Nước tăng lực",
            Unit: "Lon",
            ImageId: null,
            Branches: [new ServiceBranchItemDto(Guid.NewGuid(), 15_000m, true)]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<NotFoundError>();
    }

    [Fact]
    public async Task Handle_WhenBranchAuthorizationFails_ReturnsAuthorizationError()
    {
        // Arrange
        await using var context = CreateDbContext();
        var currentUserId = Guid.NewGuid();
        _userContext.UserId.Returns(currentUserId);

        var category = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = currentUserId,
            Name = "Đồ uống",
            IsActive = true
        };
        context.ServiceCategories.Add(category);
        await context.SaveChangesAsync();

        var branchId = Guid.NewGuid();
        _branchAuth.EnsureOwnerOfAllAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(Result.Failure(new ForbiddenError("Bạn không có quyền quản lý chi nhánh.")));

        var handler = new CreateServiceHandler(context, _branchAuth, _userContext, _publisher);
        var command = new CreateServiceCommand(
            CategoryId: category.Id,
            Name: "Nước tăng lực",
            Unit: "Lon",
            ImageId: null,
            Branches: [new ServiceBranchItemDto(branchId, 15_000m, true)]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ForbiddenError>();
    }

    [Fact]
    public async Task Handle_WhenImageSpecifiedButNotFound_ReturnsNotFoundError()
    {
        // Arrange
        await using var context = CreateDbContext();
        var currentUserId = Guid.NewGuid();
        _userContext.UserId.Returns(currentUserId);

        var category = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = currentUserId,
            Name = "Đồ uống",
            IsActive = true
        };
        context.ServiceCategories.Add(category);
        await context.SaveChangesAsync();

        var branchId = Guid.NewGuid();
        _branchAuth.EnsureOwnerOfAllAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var nonExistentImageId = Guid.NewGuid();
        var handler = new CreateServiceHandler(context, _branchAuth, _userContext, _publisher);
        var command = new CreateServiceCommand(
            CategoryId: category.Id,
            Name: "Nước tăng lực",
            Unit: "Lon",
            ImageId: nonExistentImageId,
            Branches: [new ServiceBranchItemDto(branchId, 15_000m, true)]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<NotFoundError>();
    }

    [Fact]
    public async Task Handle_WhenValidRequest_CreatesServiceAndPublishesAttachImagesEvent()
    {
        // Arrange
        await using var context = CreateDbContext();
        var currentUserId = Guid.NewGuid();
        _userContext.UserId.Returns(currentUserId);

        var category = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = currentUserId,
            Name = "Đồ uống",
            IsActive = true
        };
        var image = new Image
        {
            Id = Guid.NewGuid(),
            StorageKey = "services/test.png",
            StorageProvider = StorageProvider.S3,
            Status = ImageStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        context.ServiceCategories.Add(category);
        context.Images.Add(image);
        await context.SaveChangesAsync();

        var branchId1 = Guid.NewGuid();
        var branchId2 = Guid.NewGuid();
        _branchAuth.EnsureOwnerOfAllAsync(Arg.Any<IEnumerable<Guid>>(), Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var handler = new CreateServiceHandler(context, _branchAuth, _userContext, _publisher);
        var command = new CreateServiceCommand(
            CategoryId: category.Id,
            Name: "Nước khoáng Lavie",
            Unit: "Chai",
            ImageId: image.Id,
            Branches: [
                new ServiceBranchItemDto(branchId1, 10_000m, true),
                new ServiceBranchItemDto(branchId2, 12_000m, false)
            ]);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var serviceId = result.Value;

        // Verify database persistence
        var persisted = await context.Services
            .Include(s => s.Branches)
            .FirstOrDefaultAsync(s => s.Id == serviceId);
        persisted.ShouldNotBeNull();
        persisted.Name.ShouldBe("Nước khoáng Lavie");
        persisted.Unit.ShouldBe("Chai");
        persisted.Branches.Count.ShouldBe(2);

        // Verify event publishing
        await _publisher.Received(1).Publish(
            Arg.Is<AttachImagesEvent>(e => e.ImageIds.Contains(image.Id)),
            Arg.Any<CancellationToken>());
    }
}
