using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Matches.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Matches.Queries.GetMatches;

public sealed class GetMatchesHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetMatchesQuery, PagedList<MatchDto>>
{
    public async Task<Result<PagedList<MatchDto>>> Handle(
        GetMatchesQuery request,
        CancellationToken cancellationToken)
    {
        var query = dbContext.SocialMatches
            .AsNoTracking()
            .Include(m => m.Branch)
            .Include(m => m.SportType)
            .Include(m => m.Host)
            .Include(m => m.Participants)
            .AsQueryable();

        // 1. Lọc theo môn thể thao
        if (request.SportTypeId.HasValue)
        {
            query = query.Where(m => m.SportTypeId == request.SportTypeId.Value);
        }

        // 2. Lọc theo ngày chơi
        if (request.Date.HasValue)
        {
            query = query.Where(m => m.Date == request.Date.Value);
        }

        // 3. Lọc theo tỉnh / thành phố
        if (!string.IsNullOrWhiteSpace(request.Province))
        {
            var province = request.Province.Trim();
            query = query.Where(m => m.Branch.Province.Contains(province));
        }

        // 4. Lọc theo quận / huyện
        if (!string.IsNullOrWhiteSpace(request.District))
        {
            var district = request.District.Trim();
            query = query.Where(m => m.Branch.District.Contains(district));
        }

        // 5. Lọc theo trình độ
        if (!string.IsNullOrWhiteSpace(request.SkillLevel))
        {
            query = query.Where(m => m.SkillLevel == request.SkillLevel);
        }

        // 6. Lọc theo trạng thái kèo
        if (request.Status.HasValue)
        {
            query = query.Where(m => m.Status == request.Status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(m => new MatchDto(
                m.Id,
                m.OrderId,
                m.BranchId,
                m.Branch.Name,
                $"{m.Branch.Street}, {m.Branch.District}, {m.Branch.Province}",
                m.SportTypeId,
                m.SportType.Name,
                m.Date,
                m.StartTime,
                m.EndTime,
                m.HostId,
                m.Host.FullName ?? "Chủ phòng",
                m.SkillLevel,
                m.MissingPlayers,
                m.AvailableSlots,
                m.FeePerPlayer,
                m.ApprovalMode,
                m.Status,
                m.Description,
                m.CreatedAt,
                m.Participants.Count(p => p.Status == ParticipantStatus.Confirmed)))
            .ToListAsync(cancellationToken);

        var pagedList = new PagedList<MatchDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedList<MatchDto>>.Success(pagedList);
    }
}
