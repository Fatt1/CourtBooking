using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Matches.Dtos;
using CourtBooking.Application.Helpers;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Matches.Queries.GetMatches;

public sealed class GetMatchesHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext)
    : IQueryHandler<GetMatchesQuery, PagedList<MatchDto>>
{
    private const double KmPerDegLat = 110.574;
    private const double KmPerDegLngAtEquator = 111.320;

    public async Task<Result<PagedList<MatchDto>>> Handle(
        GetMatchesQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = userContext.IsAuthenticated ? userContext.UserId : (Guid?)null;

        var query = dbContext.SocialMatches
            .AsNoTracking()
            .Include(m => m.Branch)
            .Include(m => m.SportType)
            .Include(m => m.Host)
            .Include(m => m.Participants)
            .AsQueryable();

        // 1. Chỉ hiển thị kèo từ hiện tại và tương lai theo giờ Việt Nam (UTC+7), loại bỏ các ca đã kết thúc trong quá khứ
        var nowVn = DateTime.UtcNow.AddHours(7);
        var today = DateOnly.FromDateTime(nowVn);
        var currentTime = TimeOnly.FromDateTime(nowVn);
        query = query.Where(m => m.Date > today || (m.Date == today && m.EndTime >= currentTime));

        // 2. Lọc theo môn thể thao
        if (request.SportTypeId.HasValue)
        {
            query = query.Where(m => m.SportTypeId == request.SportTypeId.Value);
        }

        // 3. Lọc theo trình độ
        if (!string.IsNullOrWhiteSpace(request.SkillLevel))
        {
            query = query.Where(m => m.SkillLevel == request.SkillLevel);
        }

        // 8. Tính khoảng cách địa lý (GPS) tới chi nhánh: nếu không cung cấp lat/lon thì dùng Dinh Độc Lập mặc định
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

        var totalCount = await rows.CountAsync(cancellationToken);

        // Sắp xếp ưu tiên khoảng cách gần bạn nhất, sau đó đến ngày và giờ
        var sorted = rows
            .OrderBy(x => x.DistanceKm == null)
            .ThenBy(x => x.DistanceKm)
            .ThenBy(x => x.Match.Date)
            .ThenBy(x => x.Match.StartTime);

        var pageItems = await sorted
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
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
                MyStatus = currentUserId.HasValue
                    ? x.Match.Participants
                        .Where(p => p.PlayerId == currentUserId.Value && p.Status != ParticipantStatus.Cancelled)
                        .Select(p => (ParticipantStatus?)p.Status)
                        .FirstOrDefault()
                    : null,
                x.DistanceKm
            })
            .ToListAsync(cancellationToken);

        var items = pageItems.Select(x => new MatchDto(
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

        var pagedList = new PagedList<MatchDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedList<MatchDto>>.Success(pagedList);
    }
}
