using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Matches.Commands.CancelMatch;

public sealed class CancelMatchCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<CancelMatchCommand>
{
    public async Task<Result> Handle(CancelMatchCommand request, CancellationToken cancellationToken)
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
            return Result.Failure(new ForbiddenError("Chỉ có chủ phòng mới có quyền hủy kèo giao lưu này."));
        }

        // 2. Kiểm tra trạng thái kèo
        if (match.Status == SocialMatchStatus.Cancelled)
        {
            return Result.Failure(new ConflictError("Kèo giao lưu này đã bị hủy trước đó."));
        }

        // 3. Cập nhật trạng thái hủy cho kèo và tất cả người tham gia
        match.Status = SocialMatchStatus.Cancelled;
        foreach (var p in match.Participants)
        {
            p.Status = ParticipantStatus.Cancelled;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
