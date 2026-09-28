# V2 TÀI LIỆU ĐẶC TẢ YÊU CẦU CHỨC NĂNG HỆ THỐNG \(SRS\)  Copy

- **Dự án:** Nền tảng SaaS Quản Lý Cụm Sân Thể Thao \& Đặt Lịch Trực Tuyến

- **Mô hình kinh doanh:** Thuê bao SaaS \(Chủ sân trả phí dịch vụ duy trì phần mềm theo gói cho Quản trị viên sàn\)\(\)\.   

- **Cơ chế thanh toán \& Dòng tiền:**

    - Tiền đặt sân và tiền vé sự kiện được người chơi **chuyển khoản trực tiếp vào tài khoản ngân hàng của Chủ sân thông qua mã VietQR động** \(kèm nội dung chuyển khoản theo mã đơn\)\.

    - Chủ sân kiểm tra app ngân hàng và bấm **"Duyệt thanh toán"** trên hệ thống để xác nhận đơn / vé\.

    - Nếu phát sinh hủy/hoàn tiền, hai bên tự thỏa thuận và chuyển khoản hoàn trả trực tiếp ngoài đời\(\)\.   

## PHÂN HỆ QUẢN TRỊ VIÊN HỆ THỐNG \(SYSTEM ADMIN\)

### 1\.1\. Quản trị Tài khoản \& Phân quyền

- **Quản lý danh mục người dùng:** Tra cứu, khóa/mở khóa tài khoản \(`Status`\), đánh dấu xóa mềm \(`IsDeleted`\) đối với tất cả người dùng trong hệ thống \(`Users`\)\(\)\.   

- **Cấp quyền tài khoản chủ sân:** Khởi tạo tài khoản cho Chủ sân đối tác mới, kích hoạt cờ `MustChangePwd = 1` để bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên\(\)\.   

### 1\.2\. Quản trị Gói cước SaaS \(Service Packages\)

- **Cấu hình gói dịch vụ \(****`ServicePackages`****\):** Thiết lập tên gói \(Basic, Pro, VIP\), giá cước \(`Price`\), mô tả các quyền lợi/tính năng, thời hạn thuê bao theo tháng \(`DurationMonths`\), và trạng thái áp dụng \(`IsActive`\)\(\)\.   

- **Quản lý thuê bao của Chủ sân \(****`CourtOwnerSubscriptions`****\):**

    - Theo dõi lịch sử mua gói, gia hạn hoặc nâng cấp của từng chủ sân\(\)\.   

    - Kiểm soát ngày hiệu lực \(`StartDate`, `EndDate`\), mã đối soát giao dịch thu phí SaaS

### 1\.3\. Quản trị Danh mục Môn thể thao \(Sport Types\)

- Quản lý danh mục các bộ môn thể thao trên nền tảng: Cầu lông, Bóng đá, Pickleball, Tennis, Bóng rổ\.\.\. \(`SportType`: Tên, Ảnh đại diện, Trạng thái kích hoạt\)\(\)\.   

### 1\.4\. Báo cáo \& Thống kê Toàn sàn

- Thống kê tổng doanh thu từ việc bán gói cước SaaS cho các chủ sân theo ngày/tháng/năm hoặc theo khoảng thời gian tùy chọn\(\)\.   

- Thống kê tổng số lượng cơ sở sân, số lượng người chơi hoạt động và tỷ lệ sử dụng hệ thống\.

## PHÂN HỆ CHỦ SÂN \(COURT OWNER / STAFF\)

### 2\.1\. Thiết lập Hồ sơ Chi nhánh, Ngân hàng \& Loại sân

- **Thông tin chi nhánh \& Tài khoản thụ hưởng \(****`Branches`****\):**

    - Cập nhật thông tin sân: Tên sân, địa chỉ chi tiết, tọa độ vị trí \(Latitude/Longitude để định vị bản đồ\), giờ mở cửa/đóng cửa \(`OpenTime`, `CloseTime`\)\(\)\.   

    - **Cấu hình thông tin VietQR thụ hưởng:** Nhập Tên ngân hàng, Số tài khoản, Tên chủ tài khoản để hệ thống tự động tạo mã QR chuyển khoản khi khách đặt sân hoặc mua vé sự kiện\.

- **Quản lý Thư viện hình ảnh \(****`BranchImages`****\):** Tải lên các hình ảnh không gian sân bãi thực tế, quản lý thứ tự hiển thị ưu tiên \(`DisplayOrder`\)\(\)\.   

- **Quản lý Nội quy \& Chính sách \(****`BranchPolicies`****\):** Thiết lập các quy định sử dụng sân, chính sách hoàn/hủy để khách tham khảo trước khi đặt \(`Title`, `Description`\)\.

- **Quản lý Loại sân \(****`CourtTypes`****\) \& Sân cụ thể \(****`Courts`****\):**

    - Tạo các nhóm loại sân: Sân 5 người, Sân 7 người, Sân thảm tiêu chuẩn BWF, Sân VIP\.\.\.\(\)   

    - **Cấu hình thời lượng đặt tối thiểu \(****`MinBookingMinutes`****\):** Mỗi loại sân được phép quy định thời gian tối thiểu riêng biệt \(ví dụ: Sân cầu lông tối thiểu 60 phút, Sân bóng đá tối thiểu 90 phút\)\.

    - Danh sách sân chi tiết: Thêm/sửa danh sách sân con \(`Name`: Sân 1, Sân 2\.\.\.\) và cập nhật trạng thái hoạt động \(Hoạt động / Tạm bảo trì\)\(\)\.   

### 2\.2\. Cấu hình Bảng giá Đặt sân Linh hoạt \(Price Tables\)

- **Quy cách tính giá \(****`PriceTables`****\):** Thiết lập đơn vị thời gian tính tiền \(`PricingUnitMinutes` \- mặc định 60 phút\)\(\)\.   

- **Quy tắc tính giá chi tiết \(****`PriceTableRules`****\):**

    - Thiết lập giá theo dải ngày áp dụng \(`StartDate` đến `EndDate`\)\(\)\.   

    - Phân biệt giá theo thứ trong tuần: Ngày thường \(`DayOfWeekFrom = 1` đến `DayOfWeekTo = 5`\) vs\. Cuối tuần \(`DayOfWeekFrom = 6` đến `DayOfWeekTo = 0`\)\(\)\.   

    - Phân biệt khung giờ: Giờ cao điểm/vàng có giá khác giờ thấp điểm\(\)\.   

    - Phân chia loại giá: Giá khách vãng lai/đặt lẻ \(`WalkInCustomerPrice`\) và Giá khách cố định/hội viên \(`FixedCustomerPrice`\)\(\)\.   

### 2\.3\. Quản lý Khung giờ Đặt Cố định \(Fixed Time Blocks\)

- **Khung giờ mẫu định kỳ \(****`FixedTimeBlock`**** \& ****`FixedTimeBlockCourts`****\):** Cấu hình các khối giờ chuẩn định kỳ để tránh tình trạng vỡ lịch hoặc tạo khe giờ trống vô nghĩa giữa các ca\(\)\.   

- **Mặt nạ Bitwise \(****`DaysOfWeekMask`****\):** Thiết lập một khối giờ cố định áp dụng đồng thời cho nhiều thứ trong tuần \(ví dụ: Thứ 2 \+ Thứ 4 \+ Thứ 6 $\rightarrow$ mask = 42\)\(\)\.   

### 2\.4\. Tổ chức \& Quản lý Sự kiện Giao lưu / Giải đấu \(Events \& Tournaments\)

- **Tạo sự kiện giao lưu mới:**

    - Chọn chi nhánh, chọn danh sách sân và khung giờ diễn ra \(hệ thống sẽ tự động khóa các slot sân này trên lịch để tránh bị khách đặt trùng\)\.

    - Nhập tên sự kiện, nội dung mô tả, thể thức thi đấu/giao lưu, hạn chót đăng ký\.

    - Thiết lập số lượng vé mở bán tối đa \(`TotalTickets`\) và giá tiền cho mỗi vé \(`TicketPrice`\)\.

- **Quản lý danh sách người mua vé sự kiện:**

    - Xem danh sách vé đã đặt kèm trạng thái: Chờ duyệt thanh toán \(`WAITING_PAYMENT_APPROVAL`\), Đã duyệt \(`CONFIRMED`\), Đã hủy \(`CANCELLED`\)\.

    - Kiểm tra nội dung chuyển khoản trên app ngân hàng đối chiếu với mã vé/mã đơn của khách\.

    - Bấm nút **"Xác nhận đã nhận tiền"** để kích hoạt vé cho người tham gia, hoặc **"Từ chối"** nếu chưa nhận được tiền\.

    - Đóng sự kiện khi đủ số lượng hoặc hết hạn đăng ký\.

### 2\.5\. Vận hành Lưới lịch \(Real\-time Grid\) \& Duyệt Đơn Đặt Sân

- **Lưới lịch ma trận \(Time Grid\):** Trực quan hóa toàn bộ trạng thái sân theo thời gian thực \(Trống, Chờ duyệt thanh toán, Đã chốt, Đang diễn ra sự kiện, Đã hoàn thành\)\(\)\.   

- **Tạo đơn đặt trực tiếp tại quầy \(Offline Booking\):** Tạo lịch tức thì cho khách vãng lai hoặc khách gọi điện thoại, chọn slot, thêm dịch vụ nước uống/thuê dụng cụ đi kèm \(`OrderServices`\)\(\)\.   

- **Kiểm tra \& Duyệt đơn đặt sân trực tuyến:**

    - Tiếp nhận các đơn đặt sân mới từ ứng dụng/web \(trạng thái `PENDING_APPROVAL`\)\.

    - Chủ sân kiểm tra biến động tài khoản ngân hàng theo mã đơn hiển thị\.

    - **Nếu đã nhận tiền:** Bấm **"Duyệt đơn"** $\\rightarrow$ Chuyển trạng thái sang `PAID` / `ACCEPTED`, khóa vĩnh viễn slot trên lưới lịch\.

    - **Nếu hết thời gian chờ hoặc khách chuyển sai:** Bấm **"Từ chối"** $\\rightarrow$ Giải phóng slot giờ về trạng thái trống\.

- **Xử lý yêu cầu hủy đơn từ khách:**

    - Tiếp nhận yêu cầu hủy kèm lý do và số tài khoản nhận hoàn tiền của khách \(`RefundInfo`\)\(\)\.   

    - Nếu không đồng ý: Bấm **"Từ chối"**, giữ nguyên lịch\(\)\.   

    - Nếu đồng ý: Bấm **"Xác nhận hủy"** $\\rightarrow$ Hệ thống giải phóng slot sân trên `OrdersDetails`; Chủ sân chủ động mở app ngân hàng cá nhân chuyển khoản hoàn lại tiền cọc cho khách theo thỏa thuận hai bên\(\)\.   

### 2\.6\. Bán lẻ POS \& Dịch vụ tại quầy

- **Quản lý danh mục dịch vụ \(****`ServiceCategories`**** \& ****`Services`****\):** Đồ uống, bánh kẹo, thuê vợt, mua cầu, thuê giày\.\.\.\(\)   

- **Chính sách giá dịch vụ theo chi nhánh \(****`ServiceBranches`****\):** Cấu hình giá bán và trạng thái kinh doanh của từng món tại từng cơ sở\(\)\.   

- **Tạo đơn bán lẻ POS nhanh \(****`RetailOrder`**** \& ****`RetailOrderItems`****\):** Bán hàng trực tiếp không kèm đặt sân, tính tổng tiền, giảm giá và in phiếu tính tiền tại quầy\(\)\.   

### 2\.7\. Thống kê \& Báo cáo Doanh thu

- Thống kê doanh thu tiền sân thực nhận \(đã duyệt\) theo ngày/tuần/tháng/năm\(\)\.   

- Thống kê doanh thu từ bán vé sự kiện giao lưu\.

- Thống kê doanh thu bán lẻ dịch vụ tại quầy \(POS\)\(\)\.   

- Báo cáo tỷ lệ lấp đầy sân \(giờ cao điểm vs\. thấp điểm\), tỷ lệ đặt online vs\. đặt tại chỗ\(\)\.   

## PHÂN HỆ NGƯỜI CHƠI \(PLAYER / CUSTOMER\)

### 3\.1\. Tài khoản \& Hồ sơ Cá nhân \(Player Profile\)

- **Xác thực:** Đăng ký, đăng nhập tài khoản bằng Email/Mật khẩu; duy trì phiên đăng nhập bảo mật qua JWT \(`RefreshTokens`\)\(\)\.   

- **Hồ sơ người chơi \(****`PlayerProfiles`****\):** Cập nhật Ảnh đại diện, ngày sinh, giới tính, trình độ chơi thể thao\(\)\.   

### 3\.2\. Tìm kiếm Sân \& Xem Lịch trống

- **Tìm kiếm \& Bộ lọc:** Tìm sân theo khu vực/quận huyện, theo môn thể thao \(`SportTypeId`\), theo loại sân\(\)\.   

- **Xem chi tiết cơ sở:** Bộ sưu tập hình ảnh sân \(`BranchImages`\), giờ mở/đóng cửa, quy định và chính sách hủy sân \(`BranchPolicies`\)\(\)\.   

- **Lưới lịch trực tuyến:** Tra cứu các ô giờ còn trống theo ngày, theo từng sân con\(\)\. Kiểm tra điều kiện số phút đặt tối thiểu \(`MinBookingMinutes`\) của loại sân đó trước khi chọn khung giờ\.   

### 3\.3\. Đặt sân Trực tuyến \& Thanh toán VietQR

- **Đặt lịch lẻ \(Single Booking\):** Chọn sân, chọn ngày, chọn khung giờ \(thỏa mãn điều kiện thời lượng tối thiểu\), chọn mua thêm dịch vụ bổ sung nếu có\(\)\.   

- **Thanh toán trực tiếp bằng VietQR:**

    - Sau khi bấm xác nhận đặt, hệ thống hiển thị mã **VietQR động** chứa: Số tài khoản chủ sân, Tên chủ tài khoản, Số tiền chính xác và Nội dung chuyển khoản chuẩn hóa \(ví dụ: `DATSAN DH1024`\)\.

    - Giữ chỗ tạm thời trong vòng $X$ phút \(`HoldExpiresAt`\)\(\)\.   

    - Sau khi chuyển khoản, người chơi nhấn nút **"Tôi đã chuyển khoản"**; đơn hàng chuyển sang trạng thái **"Chờ chủ sân duyệt"** \(`PENDING_APPROVAL`\)\.

    - Nhận thông báo kết quả khi chủ sân xác nhận tiền đã vào tài khoản\.

### 3\.4\. Tham gia Sự kiện Giao lưu do Chủ sân Tổ chức

- **Xem danh sách sự kiện:** Lướt xem các sự kiện giao lưu, giải đấu nội bộ đang mở đăng ký tại các chi nhánh\.

- **Xem chi tiết sự kiện:** Xem thời gian, địa điểm cụ thể, thể thức thi đấu, số lượng vé còn lại, giá vé và hạn chót mua vé\.

- **Mua vé sự kiện:**

    - **Yêu cầu bắt buộc:** Người chơi phải đăng nhập tài khoản trước khi mua vé\.

    - Chọn số lượng vé cần mua $\\rightarrow$ Hệ thống tính tổng tiền\.

    - Quét mã **VietQR** trực tiếp của chủ sân với nội dung chuyển khoản định danh \(ví dụ: `VE SK05 0912345678`\)\.

    - Nhấn xác nhận đã thanh toán $\\rightarrow$ Đơn vé chuyển sang trạng thái chờ chủ sân duyệt\.

    - Sau khi chủ sân duyệt nhận tiền, vé điện tử \(kèm mã QR điểm danh\) sẽ hiển thị trong mục "Vé sự kiện của tôi"\.

### 3\.5\. Quản lý Đơn hàng, Vé \& Yêu cầu Hủy sân

- **Lịch sử hoạt động:** Quản lý danh sách các đơn đặt sân và danh sách vé sự kiện đã mua \(Sắp diễn ra, Chờ duyệt, Đã hoàn thành, Đã hủy\)\(\)\.   

- **Gửi yêu cầu hủy sân:**

    - Đối với các đơn đặt sân đã được duyệt, nếu người chơi không thể đến chơi, họ có thể gửi yêu cầu hủy\(\)\.   

    - Nhập lý do hủy \(`CancelReason`\) và thông tin tài khoản ngân hàng để nhận lại tiền cọc \(`RefundInfo`\)\(\)\.   

    - Đơn chuyển sang trạng thái `CANCELLATION_REQUESTED` chờ chủ sân liên hệ và chuyển khoản trả lại tiền\(\)\.   

### 3\.6\. Cộng đồng Tự Mở Kèo Giao lưu \(Social Matches giữa các người chơi\)

- **Tạo phòng tìm bạn chơi \(****`SocialMatches`****\):** Người chơi sau khi đặt sân thành công có thể mở phòng tìm thêm đồng đội/đối thủ cho slot giờ của mình nếu bị thiếu người\(\)\.   

- Cấu hình số người cần tuyển thêm \(`MissingPlayers`\), trình độ mong muốn \(`SkillLevel`\), mức tiền chia sẻ trên mỗi người \(`FeePerPlayer`\), chế độ duyệt thành viên \(`ApprovalMode`\)\(\)\.   

- **Tham gia ghép kèo \(****`MatchParticipants`****\):** Các người chơi khác có thể bấm xin vào giao lưu, trao đổi tin nhắn và được chủ phòng duyệt tham gia\(\)\.   

### 3\.7\. Đánh giá \& Nhận xét \(Reviews\)

- Sau khi hoàn thành buổi chơi, người chơi gửi đánh giá điểm sao \(1–5 sao\), nhận xét phản hồi chất lượng mặt sân/dịch vụ và tải kèm hình ảnh thực tế\(\)\.   

- Điểm đánh giá tự động đồng bộ vào hồ sơ chi nhánh để hỗ trợ các khách hàng khác tham khảo\(\)\.

