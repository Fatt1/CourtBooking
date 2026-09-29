using System.Security.Claims;
using CourtBooking.Application.Abstractions.Authentication;
using CourtBooking.Infrastructure.Database;
using Microsoft.AspNetCore.Http;

namespace CourtBooking.Infrastructure.Authentication;

internal sealed class UserContext(IHttpContextAccessor httpContextAccessor) : IUserContext
{
    public Guid UserId
    {
        get
        {
            // 1. Thử lấy từ JWT Token nếu có đăng nhập
            var userIdClaim = httpContextAccessor
                .HttpContext?
                .User?
                .FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? httpContextAccessor
                    .HttpContext?
                    .User?
                    .FindFirst("sub")?.Value;

            if (!string.IsNullOrWhiteSpace(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            // 2. Hỗ trợ truyền Header X-User-Id từ Postman/Swagger khi test các role khác nhau
            var customUserId = httpContextAccessor.HttpContext?.Request.Headers["X-User-Id"].ToString();
            if (!string.IsNullOrWhiteSpace(customUserId) && Guid.TryParse(customUserId, out var customGuid))
            {
                return customGuid;
            }

            // 3. Fallback: Dùng mặc định CourtOwnerUserId từ DatabaseSeeder khi chưa đăng nhập
            return DatabaseSeeder.CourtOwnerUserId;
        }
    }
}

