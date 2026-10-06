using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Matches.Commands.LeaveMatch;

public sealed class LeaveMatchCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<LeaveMatchCommand>
{
    public async Task<Result> Handle(LeaveMatchCommand request, CancellationToken cancellationToken)
    {
        var playerId = userContext.UserId;

        var match = await dbContext.SocialMatches
            .Include(m => m.Participants)
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken);

        if (match == null)
        {
            return Result.Failure(new NotFoundError("SocialMatch", request.MatchId));
        }

        // 1. Kiểm tra trạng thái kèo
        if (match.Status == SocialMatchStatus.Closed || match.Status == SocialMatchStatus.Cancelled)
        {
            return Result.Failure(new ConflictError("Kèo giao lưu đã kết thúc hoặc đã bị hủy."));
        }

        var matchStartDateTime = match.Date.ToDateTime(match.StartTime);
        if (matchStartDateTime < DateTime.Now)
        {
            return Result.Failure(new ConflictError("Trận đấu đã bắt đầu hoặc kết thúc, không thể rút lui."));
        }

        // 2. Không cho chủ phòng tự leave
        if (match.HostId == playerId)
        {
            return Result.Failure(new ConflictError("Chủ phòng không thể rời kèo. Nếu không tiếp tục tổ chức, vui lòng chọn hủy kèo."));
        }

        // 3. Tìm thành viên
        var participant = match.Participants
            .FirstOrDefault(p => p.PlayerId == playerId &&
                                (p.Status == ParticipantStatus.Confirmed || p.Status == ParticipantStatus.PendingApproval));

        if (participant == null)
        {
            return Result.Failure(new ConflictError("Bạn không có trong danh sách tham gia của kèo này."));
        }

        // 4. Hoàn trả slot nếu trước đó đã Confirmed
        if (participant.Status == ParticipantStatus.Confirmed)
        {
            match.AvailableSlots += 1;
            if (match.Status == SocialMatchStatus.Full && match.AvailableSlots > 0)
            {
                match.Status = SocialMatchStatus.Open;
            }
        }

        participant.Status = ParticipantStatus.Cancelled;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
