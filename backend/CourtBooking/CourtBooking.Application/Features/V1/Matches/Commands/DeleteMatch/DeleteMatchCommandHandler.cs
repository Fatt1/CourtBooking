using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Matches.Commands.DeleteMatch;

public sealed class DeleteMatchCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<DeleteMatchCommand>
{
    public async Task<Result> Handle(DeleteMatchCommand request, CancellationToken cancellationToken)
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
            return Result.Failure(new ForbiddenError("Chỉ có chủ phòng mới có quyền xóa kèo giao lưu này."));
        }

        // 2. Xóa hoàn toàn kèo giao lưu (tự động cascade xóa các thành viên tham gia)
        dbContext.SocialMatches.Remove(match);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
