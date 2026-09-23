
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Extensions.Paginations;

public sealed record PagedList<T>(
    List<T> Items,
    int TotalCount,
    int Page,
    int PageSize)
{
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPrevious => Page > 1;
    public bool HasNext => Page < TotalPages;

    public static async Task<PagedList<T>> CreateAsync(
        IQueryable<T> query, int Page, int PageSize, CancellationToken ct)
    {
        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((Page - 1) * PageSize)
            .Take(PageSize)
            .ToListAsync(ct);

        return new PagedList<T>(items, totalCount, Page, PageSize);
    }

    public static async Task<PagedList<T>> CreateAsync(
       IQueryable<T> query, PaginationQuery pagination, CancellationToken ct)
    {
        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync(ct);

        return new PagedList<T>(items, totalCount, pagination.Page, pagination.PageSize);
    }

}
