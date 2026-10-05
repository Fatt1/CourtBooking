using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Matches.Commands.ApproveParticipant;

public sealed class ApproveParticipantCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<ApproveParticipantCommand>
{
    public async Task<Result> Handle(ApproveParticipantCommand request, CancellationToken cancellationToken)
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
            return Result.Failure(new ForbiddenError("Chỉ có chủ phòng mới có quyền phê duyệt thành viên."));
        }

        // 2. Tìm người tham gia
        var participant = match.Participants.FirstOrDefault(p => p.Id == request.ParticipantId);
        if (participant == null)
        {
            return Result.Failure(new NotFoundError("MatchParticipant", request.ParticipantId));
        }

        if (participant.Status != ParticipantStatus.PendingApproval)
        {
            return Result.Failure(new ConflictError("Người tham gia không ở trạng thái chờ duyệt."));
        }

        // 3. Kiểm tra số chỗ còn trống
        if (match.AvailableSlots <= 0)
        {
            return Result.Failure(new ConflictError("Kèo giao lưu đã hết chỗ trống."));
        }

        // 4. Cập nhật trạng thái
        participant.Status = ParticipantStatus.Confirmed;
        match.AvailableSlots -= 1;
        if (match.AvailableSlots == 0)
        {
            match.Status = SocialMatchStatus.Full;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
