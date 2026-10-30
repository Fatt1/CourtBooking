using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.ServiceCategories.Commands.DeleteServiceCategory;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.ServiceCategories;

public sealed class DeleteServiceCategoryCommandHandlerTests : BaseHandlerTest
{
    private readonly IUserContext _userContext = Substitute.For<IUserContext>();

    [Fact]
    public async Task Handle_WhenCategoryNotFound_ReturnsNotFoundError()
    {
        // Arrange
        await using var context = CreateDbContext();
        var currentUserId = Guid.NewGuid();
        _userContext.UserId.Returns(currentUserId);

        var handler = new DeleteServiceCategoryHandler(context, _userContext);
        var command = new DeleteServiceCategoryCommand(Guid.NewGuid());

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<NotFoundError>();
    }

    [Fact]
    public async Task Handle_WhenCategoryBelongsToAnotherOwner_ReturnsNotFoundError()
    {
        // Arrange
        await using var context = CreateDbContext();
        var currentUserId = Guid.NewGuid();
        var anotherOwnerId = Guid.NewGuid();
        _userContext.UserId.Returns(currentUserId);

        var category = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = anotherOwnerId,
            Name = "Dụng cụ",
            IsActive = true
        };
        context.ServiceCategories.Add(category);
        await context.SaveChangesAsync();

        var handler = new DeleteServiceCategoryHandler(context, _userContext);
        var command = new DeleteServiceCategoryCommand(category.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<NotFoundError>();
    }

    [Fact]
    public async Task Handle_WhenCategoryIsInUseByServices_ReturnsConflictError()
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
        var service = new Service
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Name = "Nước suối",
            Unit = "Chai"
        };
        context.ServiceCategories.Add(category);
        context.Services.Add(service);
        await context.SaveChangesAsync();

        var handler = new DeleteServiceCategoryHandler(context, _userContext);
        var command = new DeleteServiceCategoryCommand(category.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldBe("Loại dịch vụ đang được sử dụng.");
    }

    [Fact]
    public async Task Handle_WhenCategoryNotInUse_DeletesCategorySuccessfully()
    {
        // Arrange
        await using var context = CreateDbContext();
        var currentUserId = Guid.NewGuid();
        _userContext.UserId.Returns(currentUserId);

        var category = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = currentUserId,
            Name = "Danh mục trống",
            IsActive = true
        };
        context.ServiceCategories.Add(category);
        await context.SaveChangesAsync();

        var handler = new DeleteServiceCategoryHandler(context, _userContext);
        var command = new DeleteServiceCategoryCommand(category.Id);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var deleted = await context.ServiceCategories.FirstOrDefaultAsync(c => c.Id == category.Id);
        deleted.ShouldBeNull();
    }
}
