using Application.UnitTests.Common.Abstractions;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Features.V1.ServiceCategories.Commands.CreateServiceCategory;
using CourtBooking.Domain.Entities.Services;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace Application.UnitTests.Features.ServiceCategories;

public sealed class CreateServiceCategoryCommandHandlerTests : BaseHandlerTest
{
    private readonly IUserContext _userContext = Substitute.For<IUserContext>();

    [Fact]
    public async Task Handle_WhenDuplicateNameExistsForSameCourtOwner_ReturnsConflictError()
    {
        // Arrange
        await using var context = CreateDbContext();
        var currentUserId = Guid.NewGuid();
        _userContext.UserId.Returns(currentUserId);

        var existingCategory = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = currentUserId,
            Name = "Đồ ăn vặt",
            IsActive = true
        };
        context.ServiceCategories.Add(existingCategory);
        await context.SaveChangesAsync();

        var handler = new CreateServiceCategoryHandler(context, _userContext);
        var command = new CreateServiceCategoryCommand(
            Name: "  Đồ ăn vặt  ", // with leading/trailing spaces
            Description: "Mô tả mới",
            IsActive: true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBeOfType<ConflictError>();
        result.Error.Message.ShouldBe("Tên loại dịch vụ đã tồn tại.");
    }

    [Fact]
    public async Task Handle_WhenSameNameExistsForDifferentCourtOwner_AllowsCreationAndReturnsSuccess()
    {
        // Arrange
        await using var context = CreateDbContext();
        var currentUserId = Guid.NewGuid();
        var anotherOwnerId = Guid.NewGuid();
        _userContext.UserId.Returns(currentUserId);

        var otherOwnerCategory = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            CourtOwnerId = anotherOwnerId,
            Name = "Đồ uống",
            IsActive = true
        };
        context.ServiceCategories.Add(otherOwnerCategory);
        await context.SaveChangesAsync();

        var handler = new CreateServiceCategoryHandler(context, _userContext);
        var command = new CreateServiceCategoryCommand(
            Name: "Đồ uống",
            Description: "Đồ uống của tôi",
            IsActive: true);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.ShouldBeTrue();
        var createdId = result.Value;

        var persisted = await context.ServiceCategories.FirstOrDefaultAsync(c => c.Id == createdId);
        persisted.ShouldNotBeNull();
        persisted.CourtOwnerId.ShouldBe(currentUserId);
        persisted.Name.ShouldBe("Đồ uống");
        persisted.Description.ShouldBe("Đồ uống của tôi");
        persisted.IsActive.ShouldBeTrue();
    }
}
