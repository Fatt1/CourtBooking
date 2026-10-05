using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Courts.Commands.CreateCourt;

internal sealed class CreateCourtHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth)
    : ICommandHandler<CreateCourtCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreateCourtCommand request,
        CancellationToken cancellationToken)
    {
        var courtType = await dbContext.CourtTypes
            .FirstOrDefaultAsync(ct => ct.Id == request.CourtTypeId, cancellationToken);

        if (courtType is null)
        {
            return Result.Failure<Guid>(new NotFoundError("CourtType", request.CourtTypeId));
        }

        var authResult = await branchAuth.EnsureOwnerAsync(courtType.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<Guid>(authResult.Error!);
        }

        var normalizedName = request.Name.Trim();

        var nameExists = await dbContext.Courts
            .AnyAsync(c => c.CourtTypeId == request.CourtTypeId && c.Name.ToLower() == normalizedName.ToLower(), cancellationToken);

        if (nameExists)
        {
            return Result.Failure<Guid>(new ConflictError($"Tên sân '{normalizedName}' đã tồn tại trong loại sân này."));
        }

        var court = new Court
        {
            Id = Guid.CreateVersion7(),
            CourtTypeId = request.CourtTypeId,
            Name = normalizedName,
            Status = CourtStatus.Available
        };

        await dbContext.Courts.AddAsync(court, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success(court.Id);
    }
}
