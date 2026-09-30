using CourtBooking.Application.Abstractions.Authorization;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Courts;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Pricing.Commands.PriceTables.CreatePriceTable;

internal sealed class CreatePriceTableHandler(
    IApplicationDbContext dbContext,
    IBranchAuthorizationService branchAuth) : ICommandHandler<CreatePriceTableCommand, Guid>
{
    public async Task<Result<Guid>> Handle(
        CreatePriceTableCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Kiểm tra quyền sở hữu chi nhánh
        var authResult = await branchAuth.EnsureOwnerAsync(request.BranchId, cancellationToken);
        if (authResult.IsFailure)
        {
            return Result.Failure<Guid>(authResult.Error!);
        }

        // 2. Kiểm tra loại sân có tồn tại và thuộc chi nhánh hay không
        var courtTypeExists = await dbContext.CourtTypes
            .AnyAsync(ct => ct.Id == request.CourtTypeId && ct.BranchId == request.BranchId, cancellationToken);

        if (!courtTypeExists)
        {
            return Result.Failure<Guid>(new NotFoundError("CourtType", request.CourtTypeId));
        }

        // 3. Kiểm tra trùng tên bảng giá trong cùng Loại sân
        var normalizedName = request.Name.Trim();
        var nameExists = await dbContext.PriceTables
            .AnyAsync(pt => pt.CourtTypeId == request.CourtTypeId
                         && pt.Name.ToLower() == normalizedName.ToLower(), cancellationToken);

        if (nameExists)
        {
            return Result.Failure<Guid>(new ConflictError($"Bảng giá '{normalizedName}' đã tồn tại trong loại sân này."));
        }

        // 4. Khởi tạo và lưu bảng giá mới (Bắt buộc dùng Guid.CreateVersion7())
        var priceTable = new PriceTable
        {
            Id = Guid.CreateVersion7(),
            CourtTypeId = request.CourtTypeId,
            Name = normalizedName,
            DefaultPrice = request.DefaultPrice,
            IsActive = request.IsActive
        };

        await dbContext.PriceTables.AddAsync(priceTable, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(priceTable.Id);
    }
}
