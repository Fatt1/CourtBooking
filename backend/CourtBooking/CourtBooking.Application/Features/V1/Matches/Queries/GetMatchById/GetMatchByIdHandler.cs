using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Matches.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Matches.Queries.GetMatchById;

public sealed class GetMatchByIdHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetMatchByIdQuery, MatchDetailDto>
{
    public async Task<Result<MatchDetailDto>> Handle(
        GetMatchByIdQuery request,
        CancellationToken cancellationToken)
    {
        var match = await dbContext.SocialMatches
            .AsNoTracking()
            .Include(m => m.Order)
            .Include(m => m.Branch)
            .Include(m => m.SportType)
            .Include(m => m.Host)
            .Include(m => m.Participants)
                .ThenInclude(p => p.Player)
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);

        if (match == null)
        {
            return Result.Failure<MatchDetailDto>(new NotFoundError("SocialMatch", request.Id));
        }

        var participantsDto = match.Participants
            .OrderBy(p => p.PlayerId == match.HostId ? 0 : 1)
            .ThenBy(p => p.JoinedAt)
            .Select(p => new MatchParticipantDto(
                p.Id,
                p.PlayerId,
                p.Player.FullName ?? "Thành viên",
                p.Status,
                p.JoinedAt,
                p.PlayerId == match.HostId))
            .ToList();

        var detailDto = new MatchDetailDto(
            match.Id,
            match.OrderId,
            match.Order.OrderCode,
            match.BranchId,
            match.Branch.Name,
            $"{match.Branch.Street}, {match.Branch.District}, {match.Branch.Province}",
            match.SportTypeId,
            match.SportType.Name,
            match.Date,
            match.StartTime,
            match.EndTime,
            match.HostId,
            match.Host.FullName ?? "Chủ phòng",
            match.SkillLevel,
            match.MissingPlayers,
            match.AvailableSlots,
            match.FeePerPlayer,
            match.ApprovalMode,
            match.Status,
            match.Description,
            match.CreatedAt,
            participantsDto);

        return Result<MatchDetailDto>.Success(detailDto);
    }
}
