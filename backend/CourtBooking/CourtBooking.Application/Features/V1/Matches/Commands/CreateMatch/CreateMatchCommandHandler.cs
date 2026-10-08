using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Matches;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Matches.Commands.CreateMatch;

public sealed class CreateMatchCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<CreateMatchCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateMatchCommand request, CancellationToken cancellationToken)
    {
        var hostId = userContext.UserId;

        // 1. Kiểm tra đơn hàng tồn tại
        var order = await dbContext.Orders
            .Include(o => o.Details)
            .Include(o => o.Branch)
            .ThenInclude(o => o.BranchSportTypes)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result.Failure<Guid>(new NotFoundError("Order", request.OrderId));
        }

        // 2. Kiểm tra quyền sở hữu: Chỉ người đặt đơn mới được mở kèo giao lưu
        if (order.PlayerId != hostId)
        {
            return Result.Failure<Guid>(new ForbiddenError("Bạn không phải là chủ sở hữu của đơn đặt sân này."));
        }

        // 3. Kiểm tra trạng thái đơn hàng (phải là Confirmed)
        if (order.Status != OrderStatus.Confirmed)
        {
            return Result.Failure<Guid>(new ConflictError("Chỉ có thể tạo kèo giao lưu cho đơn đặt sân đã được xác nhận thanh toán."));
        }

        // 4. Kiểm tra đơn hàng đã được gắn với kèo nào trước đó chưa
        var existingMatch = await dbContext.SocialMatches
            .AnyAsync(m => m.OrderId == request.OrderId, cancellationToken);

        if (existingMatch)
        {
            return Result.Failure<Guid>(new ConflictError("Đơn hàng này đã được mở kèo giao lưu trước đó."));
        }

        // 5. Lấy chi tiết lịch chơi của đơn hàng
        var firstDetail = order.Details
            .OrderBy(d => d.Date)
            .ThenBy(d => d.StartTime)
            .FirstOrDefault();

        if (firstDetail == null)
        {
            return Result.Failure<Guid>(new ConflictError("Đơn hàng chưa có thông tin chi tiết ca chơi."));
        }

        // 6. Kiểm tra thời gian chơi đã qua chưa
        var startDateTime = firstDetail.Date.ToDateTime(firstDetail.StartTime);
        if (startDateTime < DateTime.Now)
        {
            return Result.Failure<Guid>(new ConflictError("Không thể tạo kèo cho ca chơi đã diễn ra hoặc đã bắt đầu."));
        }

        // 7. Khởi tạo SocialMatch
        var match = new SocialMatch
        {
            Id = Guid.CreateVersion7(),
            OrderId = order.Id,
            BranchId = order.BranchId,
            SportTypeId = order.Branch.BranchSportTypes.FirstOrDefault()!.SportTypeId,
            Date = firstDetail.Date,
            StartTime = firstDetail.StartTime,
            EndTime = firstDetail.EndTime,
            HostId = hostId,
            SkillLevel = request.SkillLevel,
            MissingPlayers = request.MissingPlayers,
            FeePerPlayer = request.FeePerPlayer,
            ApprovalMode = request.ApprovalMode,
            AvailableSlots = request.MissingPlayers,
            Status = SocialMatchStatus.Open,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow
        };

        // Tự động thêm Host vào danh sách thành viên với trạng thái Confirmed
        match.Participants.Add(new MatchParticipant
        {
            Id = Guid.CreateVersion7(),
            MatchId = match.Id,
            PlayerId = hostId,
            Status = ParticipantStatus.Confirmed,
            JoinedAt = DateTime.UtcNow
        });

        dbContext.SocialMatches.Add(match);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(match.Id);
    }
}
