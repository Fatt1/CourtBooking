namespace CourtBooking.Domain.Enums;

public enum OrderStatus
{
    // 1. Tạo đơn & Giữ chỗ
    AwaitingPayment = 0,       // Đang giữ slot tạm thời (ví dụ: giữ trong 10-15 phút chờ khách chuyển khoản/cổng thanh toán)

    // 2. Chờ chủ sân duyệt & Giữ lịch chính thức
    PendingConfirmation = 1,   // Khách đã thanh toán xong (hoặc đặt cọc), chờ chủ sân xác nhận lịch
    Confirmed = 2,             // Chủ sân đã duyệt -> Slot sân được khóa cứng cho khách

    // 3. Sử dụng sân
    CheckedIn = 3,             // Khách đã đến sân nhận ca chơi (hoặc InUse: Đang chơi)
    Completed = 4,             // Đã chơi xong ca đấu, kết thúc phiên booking
    // 4. Hủy & Hoàn tiền
    RequestCancellation = 5,   // Khách xin hủy ca (chờ chủ sân xét theo chính sách hủy)
    Cancelled = 6,             // Đơn hủy thành công -> Nhả slot sân ra bảng lịch

}
