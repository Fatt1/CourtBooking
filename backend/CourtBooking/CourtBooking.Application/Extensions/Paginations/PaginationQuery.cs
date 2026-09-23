namespace CourtBooking.Application.Extensions.Paginations;

/// <summary>
/// Base record for all paginated queries.
/// Queries that need pagination inherit from this record and add their own filter properties.
/// </summary>
/// <example>
/// <code>
/// public record GetProductsQuery(int Page, int PageSize, string? Search)
///     : PaginationParams(Page, PageSize), IQuery&lt;PagedResult&lt;ProductResponse&gt;&gt;;
/// </code>
/// </example>
public record PaginationQuery(int Page = 1, int PageSize = 10)
{
    /// <summary>Page number — must be 1 or greater.</summary>
    public int Page { get; init; } = Math.Max(1, Page);

    /// <summary>Items per page — capped between 1 and 100.</summary>
    public int PageSize { get; init; } = Math.Clamp(PageSize, 1, 100);

}
