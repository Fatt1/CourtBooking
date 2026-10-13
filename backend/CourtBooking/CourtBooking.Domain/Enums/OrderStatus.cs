namespace CourtBooking.Domain.Enums;

public enum OrderStatus
{
    // 1. Tạo đơn & Giữ chỗ
    AwaitingPayment = 0,       // Đang giữ slot tạm thời (ví dụ: giữ trong 10-15 phút chờ khách chuyển khoản/cổng thanh toán)

    // 2. Chờ chủ sân duyệt & Giữ lịch chính thức
    PendingConfirmation = 1,   // Khách đã thanh toán xong (hoặc đặt cọc), chờ chủ sân xác nhận lịch
    Confirmed = 2,             // Chủ sân đã duyệt -> Slot sân được khóa cứng cho khách

    Completed = 3,             // Đã chơi xong ca đấu, kết thúc phiên booking
    // 4. Hủy & Hoàn tiền
    RequestCancellation = 4,   // Khách xin hủy ca (chờ chủ sân xét theo chính sách hủy)
    Cancelled = 5,             // Đơn hủy thành công -> Nhả slot sân ra bảng lịch

}
