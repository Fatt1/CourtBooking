using CourtBooking.Application.Data;
using CourtBooking.Application.Features.V1.Branches.Dtos;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Branches.Queries.GetPublicBranchById;

internal sealed class GetPublicBranchByIdHandler(IApplicationDbContext dbContext)
    : IQueryHandler<GetPublicBranchByIdQuery, PublicBranchDetailDto>
{
    public async Task<Result<PublicBranchDetailDto>> Handle(
        GetPublicBranchByIdQuery request,
        CancellationToken cancellationToken)
    {
        var branch = await dbContext.Branches.AsNoTracking().AsSplitQuery()
            .Include(b => b.BranchSportTypes).ThenInclude(bst => bst.SportType)
            .Include(b => b.Images).ThenInclude(bi => bi.Image)
            .Include(b => b.CourtTypes).ThenInclude(ct => ct.Courts)
            .Include(b => b.CourtTypes).ThenInclude(ct => ct.PriceTables).ThenInclude(pt => pt.Rules)
            .Include(b => b.ServiceBranches.Where(sb => sb.IsActive)).ThenInclude(sb => sb.Service).ThenInclude(s => s.Image)
            .Include(b => b.Reviews)
            .FirstOrDefaultAsync(b => b.Id == request.Id, cancellationToken);

        if (branch == null || !branch.IsActive)
        {
            return Result.Failure<PublicBranchDetailDto>(new NotFoundError("Branch", request.Id));
        }

        var courtTypes = branch.CourtTypes.Select(ct =>
        {
            var activePriceTables = ct.PriceTables.Where(pt => pt.IsActive).ToList();
            decimal? minPrice = activePriceTables.Count == 0
                ? null
                : activePriceTables.Min(pt => pt.Rules.Count > 0
                    ? Math.Min(pt.DefaultPrice, pt.Rules.Min(r => r.WalkInCustomerPrice))
                    : pt.DefaultPrice);

            return new PublicCourtTypeDetailDto(
                ct.Id,
                ct.Name,
                ct.MinutesConfig,
                ct.Courts.Count(c => c.Status == CourtStatus.Available),
                minPrice);
        }).ToList();

        var services = branch.ServiceBranches
            .Where(sb => sb.IsActive)
            .Select(sb => new PublicBranchServiceDto(
                sb.ServiceId,
                sb.Service.Name,
                sb.Service.Unit,
                sb.Price,
                sb.Service.Image != null ? new BranchImageDto(sb.Service.Image.Id, sb.Service.Image.StorageKey) : null))
            .ToList();

        var images = branch.Images
            .OrderBy(i => i.DisplayOrder)
            .Select(i => new BranchImageDto(i.ImageId, i.Image.StorageKey))
            .ToList();

        var sports = branch.BranchSportTypes
            .Select(bst => new BranchSportDto(bst.SportTypeId, bst.SportType.Name))
            .ToList();

        double? avgRating = branch.Reviews.Count == 0
            ? null
            : branch.Reviews.Average(r => (double)r.Rating);

        return Result.Success(new PublicBranchDetailDto(
            branch.Id,
            branch.Name,
            branch.Hotline,
            branch.Province,
            branch.District,
            branch.Street,
            branch.GgMapUrl,
            branch.Latitude,
            branch.Longitude,
            branch.OpenTime,
            branch.CloseTime,
            branch.Policy,
            images,
            sports,
            courtTypes,
            services,
            avgRating,
            branch.Reviews.Count));
    }
}
