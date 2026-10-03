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

        // 1. Kiểm tra quyền chủ phòng: Khi đã đăng nhập thì lấy từ Token, khi chưa đăng nhập thì lấy từ request để test
        var currentUserId = userContext.IsAuthenticated ? userContext.UserId : request.HostId;
        if (currentUserId.HasValue && match.HostId != currentUserId.Value)
        {
            return Result.Failure(new ForbiddenError("Chỉ có chủ phòng mới có quyền từ chối thành viên."));
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

        // 3. Cập nhật trạng thái từ chối
        participant.Status = ParticipantStatus.Rejected;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
