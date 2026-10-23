using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Application.Data;
using CourtBooking.Application.Messaging;
using CourtBooking.Domain.Enums;
using CourtBooking.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace CourtBooking.Application.Features.V1.Matches.Commands.UpdateMatch;

public sealed class UpdateMatchCommandHandler(
    IApplicationDbContext dbContext,
    IUserContext userContext) : ICommandHandler<UpdateMatchCommand>
{
    public async Task<Result> Handle(UpdateMatchCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = userContext.UserId;

        var match = await dbContext.SocialMatches
            .Include(m => m.Participants)
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);

        if (match == null)
        {
            return Result.Failure(new NotFoundError("SocialMatch", request.Id));
        }

        // 1. Kiểm tra quyền chủ phòng
        if (match.HostId != currentUserId)
        {
            return Result.Failure(new ForbiddenError("Chỉ có người tạo kèo mới có quyền chỉnh sửa kèo này."));
        }

        // 2. Số người đã được duyệt vào kèo (không tính host)
        var confirmedCount = match.Participants
            .Count(p => p.PlayerId != match.HostId && p.Status == ParticipantStatus.Confirmed);

        if (request.MissingPlayers < confirmedCount)
        {
            return Result.Failure(new ConflictError($"Số lượng người cần tuyển không thể nhỏ hơn số thành viên đã được duyệt tham gia ({confirmedCount} người)."));
        }

        // 3. Cập nhật các thông tin
        match.SkillLevel = request.SkillLevel;
        match.MissingPlayers = request.MissingPlayers;
        match.FeePerPlayer = request.FeePerPlayer;
        match.ApprovalMode = request.ApprovalMode;
        match.Description = request.Description;

        // Tính lại số slot còn trống
        var newAvailableSlots = request.MissingPlayers - confirmedCount;
        match.AvailableSlots = newAvailableSlots;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
