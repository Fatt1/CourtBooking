using CourtBooking.Application.Features.V1.SportTypes.Queries.GetAdminSportTypes;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace CourtBooking.Application.Tests.SportTypes;

public sealed class GetAdminSportTypesHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnBothStatusesAndCountAllBranches()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"admin-sport-types-{Guid.CreateVersion7()}")
            .Options;

        await using var dbContext = new ApplicationDbContext(options);
        var activeId = Guid.CreateVersion7();
        var inactiveId = Guid.CreateVersion7();

        dbContext.SportTypes.AddRange(
            new SportType { Id = activeId, Name = "Cầu lông", IsActive = true },
            new SportType { Id = inactiveId, Name = "Tennis", IsActive = false });

        dbContext.Branches.Add(new Branch
        {
            Id = Guid.CreateVersion7(),
            SportTypeId = inactiveId,
            CourtOwnerId = Guid.CreateVersion7(),
            Name = "Cụm sân Tennis",
            GgMapUrl = "https://maps.example.com",
            Province = "TP.HCM",
            District = "Quận 1",
            Street = "Đường mẫu",
            QrImageId = Guid.CreateVersion7(),
            AccountNumber = "123456",
            AccountName = "Chủ sân",
            IsActive = false
        });

        await dbContext.SaveChangesAsync();

        var handler = new GetAdminSportTypesHandler(dbContext);
        var result = await handler.Handle(
            new GetAdminSportTypesQuery(),
            CancellationToken.None);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Count.ShouldBe(2);
        result.Value.Single(item => item.Id == activeId).IsActive.ShouldBeTrue();
        var inactive = result.Value.Single(item => item.Id == inactiveId);
        inactive.IsActive.ShouldBeFalse();
        inactive.BranchCount.ShouldBe(1);
    }
}