namespace CourtBooking.API.Endpoints.V1.Events;

/// <summary>
/// Request tạo sự kiện mới cho chủ sân.
/// </summary>
public sealed record CreateOwnerEventRequest(
    Guid BranchId,
    Guid SportTypeId,
    string Title,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal TicketPrice,
    int Slots,
    string? SkillLevelFrom,
    string? SkillLevelTo,
    string? Description,
    List<Guid> CourtIds);

/// <summary>
/// Request cập nhật thông tin sự kiện.
/// </summary>
public sealed record UpdateOwnerEventRequest(
    string Title,
    decimal TicketPrice,
    int Slots,
    string? SkillLevelFrom,
    string? SkillLevelTo,
    string? Description);

/// <summary>
/// Request hủy sự kiện thể thao.
/// </summary>
public sealed record CancelOwnerEventRequest(
    string Reason);

/// <summary>
/// Request từ chối vé tham gia sự kiện.
/// </summary>
public sealed record RejectOwnerEventTicketRequest(
    string Reason);
