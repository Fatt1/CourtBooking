using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Matches.Dtos;
using CourtBooking.Application.Helpers;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Matches.Queries.GetMyJoinedMatches;

public sealed class GetMyJoinedMatchesHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : IQueryHandler<GetMyJoinedMatchesQuery, List<MatchDto>>
{
    private const double KmPerDegLat = 110.574;
    private const double KmPerDegLngAtEquator = 111.320;

    public async Task<Result<List<MatchDto>>> Handle(
        GetMyJoinedMatchesQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = userContext.UserId;

        // Lấy tất cả các kèo mà user hiện tại đã tham gia (với tư cách là người chơi, không phải host)
        var query = dbContext.SocialMatches
            .AsNoTracking()
            .Include(m => m.Branch)
            .Include(m => m.SportType)
            .Include(m => m.Host)
            .Include(m => m.Participants)
            .Where(m => m.HostId != currentUserId && m.Participants.Any(p => p.PlayerId == currentUserId && p.Status != ParticipantStatus.Cancelled && p.Status != ParticipantStatus.Rejected));

        var userLat = request.Latitude ?? GeoHelper.DefaultLatitude;
        var userLng = request.Longitude ?? GeoHelper.DefaultLongitude;

        double lat = (double)userLat;
        double lng = (double)userLng;
        double kmPerDegLng = KmPerDegLngAtEquator * Math.Cos(lat * Math.PI / 180);

        var rows = from m in query
                   let dy = ((double)m.Branch.Latitude - lat) * KmPerDegLat
                   let dx = ((double)m.Branch.Longitude - lng) * kmPerDegLng
                   select new
                   {
                       Match = m,
                       DistanceKm = (double?)Math.Sqrt(dx * dx + dy * dy)
                   };

        var items = await rows
            .OrderByDescending(x => x.Match.Date)
            .ThenByDescending(x => x.Match.StartTime)
            .Select(x => new
            {
                x.Match.Id,
                x.Match.OrderId,
                x.Match.BranchId,
                BranchName = x.Match.Branch.Name,
                BranchAddress = $"{x.Match.Branch.Street}, {x.Match.Branch.District}, {x.Match.Branch.Province}",
                x.Match.SportTypeId,
                SportTypeName = x.Match.SportType.Name,
                x.Match.Date,
                x.Match.StartTime,
                x.Match.EndTime,
                x.Match.HostId,
                HostName = x.Match.Host.FullName ?? "Chủ phòng",
                x.Match.SkillLevel,
                x.Match.MissingPlayers,
                x.Match.AvailableSlots,
                x.Match.FeePerPlayer,
                x.Match.ApprovalMode,
                x.Match.Description,
                x.Match.CreatedAt,
                ConfirmedCount = x.Match.Participants.Count(p => p.Status == ParticipantStatus.Confirmed),
                MyStatus = x.Match.Participants.Where(p => p.PlayerId == currentUserId).Select(p => (ParticipantStatus?)p.Status).FirstOrDefault(),
                x.DistanceKm
            })
            .ToListAsync(cancellationToken);

        var resultDtos = items.Select(x => new MatchDto(
            x.Id,
            x.OrderId,
            x.BranchId,
            x.BranchName,
            x.BranchAddress,
            x.SportTypeId,
            x.SportTypeName,
            x.Date,
            x.StartTime,
            x.EndTime,
            x.HostId,
            x.HostName,
            x.SkillLevel,
            x.MissingPlayers,
            x.AvailableSlots,
            x.FeePerPlayer,
            x.ApprovalMode,
            x.Description,
            x.CreatedAt,
            x.ConfirmedCount,
            x.DistanceKm.HasValue ? Math.Round(x.DistanceKm.Value, 1) : null,
            x.MyStatus
        )).ToList();

        return Result<List<MatchDto>>.Success(resultDtos);
    }
}
