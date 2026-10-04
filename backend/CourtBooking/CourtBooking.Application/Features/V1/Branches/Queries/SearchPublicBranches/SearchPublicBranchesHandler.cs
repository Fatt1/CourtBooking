using CourtBooking.Application.Abstractions.Courts;
using CourtBooking.Application.Data;
using CourtBooking.Application.Extensions.Paginations;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Queries.SearchPublicBranches;

internal sealed class SearchPublicBranchesHandler(
    IApplicationDbContext dbContext,
    IPriceCalculator priceCalculator)
    : IQueryHandler<SearchPublicBranchesQuery, PagedList<PublicBranchListItemDto>>
{
    public async Task<Result<PagedList<PublicBranchListItemDto>>> Handle(
        SearchPublicBranchesQuery request,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Branches.AsNoTracking()
            .Where(branch => branch.IsActive);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var pattern = $"%{request.Search.Trim()}%";
            query = query.Where(branch =>
                EF.Functions.Like(branch.Name, pattern)
                || EF.Functions.Like(branch.Province, pattern)
                || EF.Functions.Like(branch.District, pattern)
                || EF.Functions.Like(branch.Street, pattern));
        }

        if (!string.IsNullOrWhiteSpace(request.Province))
        {
            var pattern = $"%{request.Province.Trim()}%";
            query = query.Where(branch => EF.Functions.Like(branch.Province, pattern));
        }

        if (!string.IsNullOrWhiteSpace(request.District))
        {
            var pattern = $"%{request.District.Trim()}%";
            query = query.Where(branch => EF.Functions.Like(branch.District, pattern));
        }

        if (request.SportTypeId.HasValue)
        {
            query = query.Where(branch => branch.BranchSportTypes
                .Any(item => item.SportTypeId == request.SportTypeId.Value));
        }

        if (!string.IsNullOrWhiteSpace(request.CourtType))
        {
            var pattern = $"%{request.CourtType.Trim()}%";
            query = query.Where(branch => branch.CourtTypes
                .Any(courtType => EF.Functions.Like(courtType.Name, pattern)));
        }

        if (request.MinRating.HasValue)
        {
            query = query.Where(branch => branch.Reviews.Any()
                && branch.Reviews.Average(review => (double)review.Rating) >= request.MinRating.Value);
        }

        var branchRows = await query
            .Select(branch => new BranchCandidateRow(
                branch.Id,
                branch.Name,
                branch.Province,
                branch.District,
                branch.Street,
                branch.Latitude,
                branch.Longitude,
                branch.OpenTime,
                branch.CloseTime,
                branch.Reviews.Select(review => (double?)review.Rating).Average(),
                branch.Reviews.Count))
            .ToListAsync(cancellationToken);

        if (branchRows.Count == 0)
        {
            return Result.Success(new PagedList<PublicBranchListItemDto>(
                [], 0, request.Page, request.PageSize));
        }

        var branchIds = branchRows.Select(branch => branch.Id).ToList();
        IQueryable<CourtType> courtTypesQuery = dbContext.CourtTypes.AsNoTracking()
            .Where(courtType => branchIds.Contains(courtType.BranchId));

        if (!string.IsNullOrWhiteSpace(request.CourtType))
        {
            var pattern = $"%{request.CourtType.Trim()}%";
            courtTypesQuery = courtTypesQuery
                .Where(courtType => EF.Functions.Like(courtType.Name, pattern));
        }

        courtTypesQuery = courtTypesQuery
            .Include(courtType => courtType.Courts)
            .Include(courtType => courtType.PriceTables.Where(priceTable => priceTable.IsActive))
                .ThenInclude(priceTable => priceTable.Rules);

        if (request.Date.HasValue && request.StartTime.HasValue)
        {
            courtTypesQuery = courtTypesQuery
                .Include(courtType => courtType.FixedTimeBlocks)
                    .ThenInclude(block => block.Courts);
        }

        var courtTypes = await courtTypesQuery
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        var occupiedSlots = await GetOccupiedSlotsAsync(
            courtTypes,
            request.Date,
            cancellationToken);

        var states = new List<BranchCandidateState>();

        foreach (var branch in branchRows)
        {
            var branchCourtTypes = courtTypes
                .Where(courtType => courtType.BranchId == branch.Id)
                .ToList();

            var courtTypeSummaries = new List<PublicCourtTypeSummaryDto>();
            int? branchAvailableCourtCount = null;

            foreach (var courtType in branchCourtTypes)
            {
                int? availableCourtCount = null;

                if (request.Date.HasValue && request.StartTime.HasValue)
                {
                    availableCourtCount = CountAvailableCourts(
                        branch,
                        courtType,
                        request.Date.Value,
                        request.StartTime.Value,
                        occupiedSlots);
                }

                var minPrice = GetMinimumPrice(
                    courtType,
                    request.Date,
                    request.StartTime);

                courtTypeSummaries.Add(new PublicCourtTypeSummaryDto(
                    courtType.Id,
                    courtType.Name,
                    courtType.MinutesConfig,
                    availableCourtCount,
                    minPrice));
            }

            if (request.Date.HasValue && request.StartTime.HasValue)
            {
                branchAvailableCourtCount = courtTypeSummaries
                    .Sum(courtType => courtType.AvailableCourtCount ?? 0);

                if (branchAvailableCourtCount == 0)
                {
                    continue;
                }
            }

            var branchMinPrice = courtTypeSummaries
                .Where(courtType => courtType.MinPrice.HasValue)
                .Select(courtType => courtType.MinPrice!.Value)
                .DefaultIfEmpty()
                .Min();

            decimal? nullableBranchMinPrice = courtTypeSummaries.Any(courtType => courtType.MinPrice.HasValue)
                ? branchMinPrice
                : null;

            double? distanceKm = null;
            if (request.Latitude.HasValue
                && request.Longitude.HasValue
                && branch.Latitude.HasValue
                && branch.Longitude.HasValue)
            {
                distanceKm = CalculateDistanceKm(
                    (double)request.Latitude.Value,
                    (double)request.Longitude.Value,
                    (double)branch.Latitude.Value,
                    (double)branch.Longitude.Value);
            }

            states.Add(new BranchCandidateState(
                branch,
                courtTypeSummaries,
                branchAvailableCourtCount,
                nullableBranchMinPrice,
                distanceKm));
        }

        IEnumerable<BranchCandidateState> orderedStates = request.Sort switch
        {
            "rating_desc" => states
                .OrderByDescending(state => state.Branch.AverageRating ?? 0)
                .ThenByDescending(state => state.Branch.ReviewCount),
            "distance" => states.OrderBy(state => state.DistanceKm ?? double.MaxValue),
            "price_asc" => states.OrderBy(state => state.MinPrice ?? decimal.MaxValue),
            _ => states.OrderBy(state => state.Branch.Name)
        };

        var ordered = orderedStates.ToList();
        var totalCount = ordered.Count;
        var pageStates = ordered
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        if (pageStates.Count == 0)
        {
            return Result.Success(new PagedList<PublicBranchListItemDto>(
                [], totalCount, request.Page, request.PageSize));
        }

        var pageBranchIds = pageStates.Select(state => state.Branch.Id).ToList();
        var displayBranches = await dbContext.Branches.AsNoTracking()
            .Where(branch => pageBranchIds.Contains(branch.Id))
            .Include(branch => branch.BranchSportTypes)
                .ThenInclude(item => item.SportType)
            .Include(branch => branch.Images)
                .ThenInclude(image => image.Image)
            .Include(branch => branch.ServiceBranches.Where(service => service.IsActive))
                .ThenInclude(service => service.Service)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        var displayBranchById = displayBranches.ToDictionary(branch => branch.Id);
        var items = new List<PublicBranchListItemDto>(pageStates.Count);

        foreach (var state in pageStates)
        {
            var branch = displayBranchById[state.Branch.Id];
            var coverImage = branch.Images
                .OrderBy(image => image.DisplayOrder)
                .Select(image => new BranchImageDto(image.ImageId, image.Image.StorageKey))
                .FirstOrDefault();

            var sports = branch.BranchSportTypes
                .Select(item => new BranchSportDto(item.SportTypeId, item.SportType.Name))
                .ToList();

            var services = branch.ServiceBranches
                .Where(service => service.IsActive)
                .Select(service => service.Service.Name)
                .Distinct()
                .ToList();

            items.Add(new PublicBranchListItemDto(
                state.Branch.Id,
                state.Branch.Name,
                state.Branch.Province,
                state.Branch.District,
                state.Branch.Street,
                state.Branch.Latitude,
                state.Branch.Longitude,
                coverImage,
                sports,
                state.CourtTypes,
                state.Branch.OpenTime,
                state.Branch.CloseTime,
                state.Branch.AverageRating,
                state.Branch.ReviewCount,
                state.DistanceKm,
                state.AvailableCourtCount,
                state.MinPrice,
                services));
        }

        return Result.Success(new PagedList<PublicBranchListItemDto>(
            items,
            totalCount,
            request.Page,
            request.PageSize));
    }

    private async Task<List<OccupiedSlot>> GetOccupiedSlotsAsync(
        IReadOnlyList<CourtType> courtTypes,
        DateOnly? date,
        CancellationToken cancellationToken)
    {
        if (!date.HasValue)
        {
            return [];
        }

        var courtIds = courtTypes
            .SelectMany(courtType => courtType.Courts)
            .Where(court => court.Status == CourtStatus.Available)
            .Select(court => court.Id)
            .Distinct()
            .ToList();

        if (courtIds.Count == 0)
        {
            return [];
        }

        var relevantDates = new[]
        {
            date.Value.AddDays(-1),
            date.Value,
            date.Value.AddDays(1)
        };
        var nowUtc = DateTime.UtcNow;
        var rows = await dbContext.OrderDetails.AsNoTracking()
            .Where(detail => courtIds.Contains(detail.CourtId)
                && relevantDates.Contains(detail.Date)
                && detail.Order.Status != OrderStatus.Cancelled
                && (detail.Order.Status != OrderStatus.AwaitingPayment
                    || detail.Order.HoldExpiresAt > nowUtc))
            .Select(detail => new
            {
                detail.CourtId,
                detail.Date,
                detail.StartTime,
                detail.EndTime
            })
            .ToListAsync(cancellationToken);

        return rows
            .Select(row => new OccupiedSlot(row.CourtId, row.Date, row.StartTime, row.EndTime))
            .ToList();
    }

    private int CountAvailableCourts(
        BranchCandidateRow branch,
        CourtType courtType,
        DateOnly date,
        TimeOnly startTime,
        IReadOnlyList<OccupiedSlot> occupiedSlots)
    {
        if (courtType.MinutesConfig <= 0 || !courtType.PriceTables.Any(priceTable => priceTable.IsActive))
        {
            return 0;
        }

        if (!TryGetSlotWindow(
            date,
            branch.OpenTime,
            branch.CloseTime,
            startTime,
            courtType.MinutesConfig,
            out var slotStart,
            out var slotEnd))
        {
            return 0;
        }

        return courtType.Courts.Count(court =>
            court.Status == CourtStatus.Available
            && IsAllowedByFixedTimeBlocks(courtType, court, date, slotStart, slotEnd)
            && !IsOccupied(court.Id, slotStart, slotEnd, occupiedSlots));
    }

    private decimal? GetMinimumPrice(
        CourtType courtType,
        DateOnly? date,
        TimeOnly? startTime)
    {
        var activePriceTables = courtType.PriceTables
            .Where(priceTable => priceTable.IsActive)
            .ToList();

        if (activePriceTables.Count == 0)
        {
            return null;
        }

        if (date.HasValue && startTime.HasValue && courtType.MinutesConfig > 0)
        {
            var endTime = startTime.Value.AddMinutes(courtType.MinutesConfig);
            return activePriceTables.Min(priceTable => priceCalculator.CalculatePrice(
                priceTable,
                date.Value,
                startTime.Value,
                endTime,
                isFixedCustomer: false));
        }

        return activePriceTables.Min(priceTable => priceTable.Rules.Count == 0
            ? priceTable.DefaultPrice
            : Math.Min(
                priceTable.DefaultPrice,
                priceTable.Rules.Min(rule => rule.WalkInCustomerPrice)));
    }

    private static bool IsAllowedByFixedTimeBlocks(
        CourtType courtType,
        Court court,
        DateOnly date,
        DateTime slotStart,
        DateTime slotEnd)
    {
        var dayBit = 1 << (int)date.DayOfWeek;
        var courtBlocks = courtType.FixedTimeBlocks
            .Where(block => (block.DaysOfWeekMask & dayBit) != 0
                && block.Courts.Any(mapping => mapping.CourtId == court.Id));

        foreach (var block in courtBlocks)
        {
            var blockStart = date.ToDateTime(block.StartTime);
            var blockEnd = date.ToDateTime(block.EndTime);
            if (blockEnd <= blockStart)
            {
                blockEnd = blockEnd.AddDays(1);
            }

            var overlaps = slotStart < blockEnd && slotEnd > blockStart;
            var isExactBlock = slotStart == blockStart && slotEnd == blockEnd;
            if (overlaps && !isExactBlock)
            {
                return false;
            }
        }

        return true;
    }

    private static bool IsOccupied(
        Guid courtId,
        DateTime slotStart,
        DateTime slotEnd,
        IReadOnlyList<OccupiedSlot> occupiedSlots)
    {
        foreach (var occupied in occupiedSlots.Where(slot => slot.CourtId == courtId))
        {
            var occupiedStart = occupied.Date.ToDateTime(occupied.StartTime);
            var occupiedEnd = occupied.Date.ToDateTime(occupied.EndTime);
            if (occupiedEnd <= occupiedStart)
            {
                occupiedEnd = occupiedEnd.AddDays(1);
            }

            if (slotStart < occupiedEnd && slotEnd > occupiedStart)
            {
                return true;
            }
        }

        return false;
    }

    private static bool TryGetSlotWindow(
        DateOnly date,
        TimeOnly openTime,
        TimeOnly closeTime,
        TimeOnly startTime,
        int durationMinutes,
        out DateTime slotStart,
        out DateTime slotEnd)
    {
        slotStart = date.ToDateTime(startTime);
        slotEnd = slotStart.AddMinutes(durationMinutes);

        if (closeTime > openTime)
        {
            var openAt = date.ToDateTime(openTime);
            var closeAt = date.ToDateTime(closeTime);
            return slotStart >= openAt && slotEnd <= closeAt;
        }

        if (closeTime < openTime)
        {
            DateTime openAt;
            DateTime closeAt;

            if (startTime >= openTime)
            {
                openAt = date.ToDateTime(openTime);
                closeAt = date.AddDays(1).ToDateTime(closeTime);
            }
            else if (startTime < closeTime)
            {
                openAt = date.AddDays(-1).ToDateTime(openTime);
                closeAt = date.ToDateTime(closeTime);
            }
            else
            {
                return false;
            }

            return slotStart >= openAt && slotEnd <= closeAt;
        }

        return false;
    }

    private static double CalculateDistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusKm = 6371;
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
            + Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2))
            * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return Math.Round(earthRadiusKm * c, 2);
    }

    private static double ToRadians(double angle) => Math.PI * angle / 180.0;

    private sealed record BranchCandidateRow(
        Guid Id,
        string Name,
        string Province,
        string District,
        string Street,
        decimal? Latitude,
        decimal? Longitude,
        TimeOnly OpenTime,
        TimeOnly CloseTime,
        double? AverageRating,
        int ReviewCount);

    private sealed record BranchCandidateState(
        BranchCandidateRow Branch,
        IReadOnlyList<PublicCourtTypeSummaryDto> CourtTypes,
        int? AvailableCourtCount,
        decimal? MinPrice,
        double? DistanceKm);

    private sealed record OccupiedSlot(
        Guid CourtId,
        DateOnly Date,
        TimeOnly StartTime,
        TimeOnly EndTime);
}
