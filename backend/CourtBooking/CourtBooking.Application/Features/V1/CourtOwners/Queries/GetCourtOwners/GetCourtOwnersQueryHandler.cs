using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.CourtOwners.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.CourtOwners.Queries.GetCourtOwners;

internal sealed class GetCourtOwnersQueryHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetCourtOwnersQuery, PagedList<CourtOwnerSummaryDto>>
{
    public async Task<Result<PagedList<CourtOwnerSummaryDto>>> Handle(GetCourtOwnersQuery request, CancellationToken ct)
    {
        var query = dbContext.Users
            .AsNoTracking()
            .Where(u => u.AccountType == AccountType.CourtOwner && u.CourtOwner != null);

        // 1. Tìm kiếm theo từ khóa: Tên, Email hoặc Số điện thoại
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(u =>
                u.FullName.Contains(search) ||
                (u.Email != null && u.Email.Contains(search)) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(search)));
        }

        // 2. Lọc theo trạng thái tài khoản (Hoạt động / Đã khóa)
        if (request.Status.HasValue)
        {
            query = query.Where(u => u.Status == request.Status.Value);
        }

        // 3. Sắp xếp chủ sân mới tạo lên đầu
        query = query.OrderByDescending(u => u.CreatedAt);

        var totalCount = await query.CountAsync(ct);

        var rawItems = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.PhoneNumber,
                BusinessName = u.CourtOwner!.BusinessName,
                u.Status,
                u.CourtOwner!.MustChangePwd,
                u.CreatedAt,
                CurrentPackageName = u.CourtOwner!.ServicePackage != null ? u.CourtOwner.ServicePackage.Name : null,
                PackageStartDate = u.CourtOwner!.PackageStartDate,
                PackageEndDate = u.CourtOwner!.PackageEndDate
            })
            .ToListAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var items = rawItems.Select(x =>
        {
            var isSubActive = x.PackageStartDate.HasValue && x.PackageEndDate.HasValue
                              && today >= x.PackageStartDate.Value && today <= x.PackageEndDate.Value;

            var remainingDays = (x.PackageEndDate.HasValue && x.PackageEndDate.Value >= today)
                ? (x.PackageEndDate.Value.DayNumber - today.DayNumber)
                : 0;

            return new CourtOwnerSummaryDto(
                x.Id,
                x.FullName,
                x.Email,
                x.PhoneNumber,
                x.BusinessName,
                x.Status,
                x.MustChangePwd,
                x.CreatedAt,
                x.CurrentPackageName,
                x.PackageStartDate,
                x.PackageEndDate,
                isSubActive,
                remainingDays);
        }).ToList();

        return Result.Success(new PagedList<CourtOwnerSummaryDto>(items, totalCount, request.Page, request.PageSize));
    }
}
