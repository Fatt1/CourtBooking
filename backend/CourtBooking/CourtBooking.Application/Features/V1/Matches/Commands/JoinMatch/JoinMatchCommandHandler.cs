using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Entities.Matches;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Matches.Commands.JoinMatch;

public sealed class JoinMatchCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<JoinMatchCommand, Guid>
{
    public async Task<Result<Guid>> Handle(JoinMatchCommand request, CancellationToken cancellationToken)
    {
        var playerId = userContext.UserId;

        var match = await dbContext.SocialMatches
            .Include(m => m.Participants)
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken);

        if (match == null)
        {
            return Result.Failure<Guid>(new NotFoundError("SocialMatch", request.MatchId));
        }

        // 1. Kiểm tra trạng thái kèo
        if (match.Status != SocialMatchStatus.Open || match.AvailableSlots <= 0)
        {
            return Result.Failure<Guid>(new ConflictError("Kèo giao lưu đã đủ người hoặc không còn nhận thêm thành viên."));
        }

        // 2. Không cho chủ kèo tự join
        if (match.HostId == playerId)
        {
            return Result.Failure<Guid>(new ConflictError("Bạn là người tạo kèo này, không thể gửi yêu cầu tham gia."));
        }

        // 3. Kiểm tra xem người chơi đã có trong danh sách chưa
        var existingParticipant = match.Participants
            .FirstOrDefault(p => p.PlayerId == playerId);

        if (existingParticipant != null)
        {
            if (existingParticipant.Status == ParticipantStatus.Confirmed)
            {
                return Result.Failure<Guid>(new ConflictError("Bạn đã là thành viên chính thức của kèo này."));
            }
            if (existingParticipant.Status == ParticipantStatus.PendingApproval)
            {
                return Result.Failure<Guid>(new ConflictError("Yêu cầu tham gia của bạn đang chờ chủ phòng xét duyệt."));
            }

            // Nếu trước đó đã hủy hoặc bị từ chối, cập nhật lại trạng thái mới
            existingParticipant.Status = match.ApprovalMode == 0
                ? ParticipantStatus.Confirmed
                : ParticipantStatus.PendingApproval;
            existingParticipant.JoinedAt = DateTime.UtcNow;

            if (match.ApprovalMode == 0)
            {
                match.AvailableSlots -= 1;
                if (match.AvailableSlots == 0)
                {
                    match.Status = SocialMatchStatus.Full;
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return Result<Guid>.Success(existingParticipant.Id);
        }

        // 4. Khởi tạo người tham gia mới
        var participantStatus = match.ApprovalMode == 0
            ? ParticipantStatus.Confirmed
            : ParticipantStatus.PendingApproval;

        var participant = new MatchParticipant
        {
            Id = Guid.CreateVersion7(),
            MatchId = match.Id,
            PlayerId = playerId,
            Status = participantStatus,
            JoinedAt = DateTime.UtcNow
        };

        if (match.ApprovalMode == 0)
        {
            match.AvailableSlots -= 1;
            if (match.AvailableSlots == 0)
            {
                match.Status = SocialMatchStatus.Full;
            }
        }

        match.Participants.Add(participant);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(participant.Id);
    }
}
