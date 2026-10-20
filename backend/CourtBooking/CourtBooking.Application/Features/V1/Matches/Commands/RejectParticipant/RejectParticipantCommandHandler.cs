using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Matches.Commands.RejectParticipant;

public sealed class RejectParticipantCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<RejectParticipantCommand>
{
    public async Task<Result> Handle(RejectParticipantCommand request, CancellationToken cancellationToken)
    {
        var match = await dbContext.SocialMatches
            .Include(m => m.Participants)
            .FirstOrDefaultAsync(m => m.Id == request.MatchId, cancellationToken);

        if (match == null)
        {
            return Result.Failure(new NotFoundError("SocialMatch", request.MatchId));
        }

        // 1. Kiểm tra quyền chủ phòng
        var currentUserId = userContext.UserId;
        if (match.HostId != currentUserId)
        {
            return Result.Failure(new ForbiddenError("Chỉ có chủ phòng mới có quyền từ chối thành viên."));
        }

        // 2. Tìm người tham gia
        var participant = match.Participants.FirstOrDefault(p => p.Id == request.ParticipantId);
        if (participant == null)
        {
            return Result.Failure(new NotFoundError("MatchParticipant", request.ParticipantId));
        }

        // 3. Xóa hoàn toàn người tham gia ra khỏi danh sách participants
        if (participant.Status == ParticipantStatus.Confirmed)
        {
            match.AvailableSlots += 1;
        }

        dbContext.MatchParticipants.Remove(participant);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
