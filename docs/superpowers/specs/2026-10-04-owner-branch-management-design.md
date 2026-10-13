# Thiết kế API quản lý chi nhánh cho chủ sân

**Ngày:** 2026-10-04  
**Trạng thái:** Chờ người dùng duyệt tài liệu

## Mục tiêu và phạm vi

Chủ sân quản lý các chi nhánh của chính mình qua API: xem danh sách, xem chi tiết, thêm, sửa bằng `PUT`, và xóa khi chi nhánh chưa có dữ liệu nghiệp vụ liên quan. Một chi nhánh có thể cung cấp nhiều môn thể thao; khi tạo và sau khi sửa phải còn ít nhất một môn.

Đợt này không làm API chi nhánh công khai cho khách, API xem nội dung đánh giá, hay thay đổi `Court`/`CourtType` để xác định môn của từng sân. Danh sách môn ở cấp chi nhánh chỉ mô tả các môn chi nhánh cung cấp; nó chưa chứng minh một sân cụ thể chơi được môn nào. Giá thuê và logic chống trùng lịch hiện có không đổi.

Tài liệu này thay thế các quyết định về Branch trong đặc tả `2026-09-30-court-management-api-design.md` khi hai tài liệu khác nhau; các phần SportType/CourtType/Court khác không được mở rộng bởi đợt này.

## Hiện trạng và lựa chọn mô hình

`Branch` hiện có một `SportTypeId` bắt buộc. `SportType.Branches`, cấu hình EF, dữ liệu mẫu, số chi nhánh trong API Admin SportTypes và quy tắc xóa SportType đều dựa vào quan hệ một-nhiều này. Chưa có endpoint quản lý Branch. `Branch.Hotline` cùng migration `AddBranchHotline` đã được tạo trong worktree nhưng chưa commit; giữ nguyên thay đổi đó và tạo migration nhiều môn tiếp theo, không viết lại lịch sử migration.

Chọn quan hệ nhiều-nhiều tường minh `BranchSportType` (khóa ghép `BranchId`, `SportTypeId`) thay vì lưu danh sách ID trong một cột. Cách này cho phép khóa ngoại, chặn cặp trùng và truy vấn/đếm chi nhánh theo môn. Không thêm quan hệ từ `SportType` đến `Court` hoặc `CourtType`.

## Migration và tương thích

1. Tạo bảng liên kết `BranchSportTypes`. Xóa Branch làm mất liên kết tương ứng; xóa SportType khi còn liên kết vẫn bị chặn.
2. Trong cùng migration, chép mỗi cặp `Branches.Id` và `Branches.SportTypeId` hiện tại vào bảng mới **trước khi** bỏ khóa ngoại, chỉ mục và cột `Branches.SportTypeId`.
3. Cập nhật EF model/snapshot và seeder để tạo ít nhất một liên kết môn cho mỗi chi nhánh mẫu. Không suy ra môn thứ hai từ tên chi nhánh; dữ liệu cũ chỉ chứng minh môn đã lưu trong `SportTypeId`.
4. Sửa `GetAdminSportTypesHandler` để `BranchCount` đếm số chi nhánh liên kết với môn; sửa `DeleteSportTypeHandler` để trả Conflict khi còn bất kỳ liên kết nào. Giữ các quy tắc về sự kiện và kèo giao lưu.
5. Dữ liệu đặt sân, bảng giá, Court và CourtType không đổi. Migration `Down` chỉ được phục hồi cột cũ khi mỗi chi nhánh còn đúng một môn; nếu có chi nhánh nhiều môn, `Down` phải dừng với lỗi rõ ràng thay vì tự chọn một môn và làm mất dữ liệu. Cần sao lưu/kiểm tra dữ liệu trước khi rollback migration.

## Owner API

Các endpoint dùng quy ước Minimal API `IEndpointGroup`/`MapApiV1Group`, MediatR, FluentValidation, `Result` và ProblemDetails hiện có. `Program.cs` đã tự khám phá endpoint group, nên không cần gọi map thủ công. Tất cả route yêu cầu JWT role `CourtOwner`; handler cũng lọc/kiểm tra quyền theo `IUserContext.UserId`. Client không được gửi `CourtOwnerId`.

| Method | Route | Kết quả |
|---|---|---|
| GET | `/api/v1/owner/branches` | Danh sách tất cả chi nhánh của chủ sân đăng nhập, kể cả chi nhánh không hoạt động; 200 |
| GET | `/api/v1/owner/branches/{id}` | Chi tiết chi nhánh thuộc chủ sân; 200 |
| POST | `/api/v1/owner/branches` | Tạo chi nhánh, trả ID và Location; 201 |
| PUT | `/api/v1/owner/branches/{id}` | Thay thông tin có thể chỉnh sửa và toàn bộ danh sách môn/ảnh; 204 |
| DELETE | `/api/v1/owner/branches/{id}` | Xóa chi nhánh chưa có dữ liệu nghiệp vụ liên quan; 204 |

Không thêm endpoint đổi trạng thái riêng trong đợt này. Chi nhánh mới có `IsActive = true`; danh sách/chi tiết Owner vẫn đọc được trạng thái hiện có. Không mở quyền đọc dữ liệu ngân hàng ở route công khai.

## Request và response

`POST`/`PUT` yêu cầu: `name`, `hotline`, `province`, `district`, `street`, `ggMapUrl`, `openTime`, `closeTime`, `qrImageId`, `accountNumber`, `accountName`, và `sportTypeIds` có ít nhất một ID. `policy`, `latitude`, `longitude` và `imageIds` của thư viện ảnh là tùy chọn. `PUT` dùng danh sách môn/ảnh gửi lên làm tập mới; không dùng `PATCH`. Các trường server quản lý như ID, owner ID, thời điểm audit, `ReviewTotal` và `IsActive` không nằm trong request.

Ràng buộc chiều dài giữ theo cấu hình EF hiện tại: tên 255, hotline 20, tỉnh/quận 100, địa chỉ/Google Maps URL/tài khoản ngân hàng 255; chuỗi bắt buộc không được chỉ chứa khoảng trắng. `sportTypeIds` và `imageIds` không được trùng, tất cả ID phải tồn tại; ảnh QR và thư viện ảnh tham chiếu ảnh đã upload qua Storage API. `openTime` và `closeTime` không được bằng nhau. Không tự áp đặt quy tắc giờ mở nhỏ hơn giờ đóng vì chi nhánh có thể hoạt động qua nửa đêm.

Response chi tiết Owner chứa các trường cấu hình nêu trên, `id`, `isActive`, danh sách môn (`id`, `name`) và ảnh QR/thư viện ảnh theo thứ tự (`id`, `key`). Response danh sách chứa dữ liệu để hiện bảng quản lý: ID, tên, địa chỉ, hotline, giờ hoạt động, trạng thái, danh sách môn, ảnh đại diện đầu tiên nếu có, cùng số lượng và điểm trung bình đánh giá. Điểm trung bình và số lượng lấy từ các `Review` hiện có; chưa có endpoint đọc từng đánh giá.

## Xử lý và lỗi

- Tạo/sửa: kiểm tra dữ liệu và quyền, kiểm tra SportType/Image tồn tại, đồng bộ các liên kết môn và ảnh, lưu thay đổi. Dùng cơ chế attach/release ảnh hiện có sau khi lưu; không xóa bản ghi `SportType` hay `Image` bằng cascade ngoài chủ đích.
- Đọc: luôn giới hạn theo owner từ token, không tin owner ID từ query/body.
- Xóa: kiểm tra owner và chặn với `409 Conflict` nếu có `CourtType` (bao gồm sân/bảng giá/lịch phụ thuộc), `ServiceBranch`, `Review`, `Order`, `SocialMatch` hoặc `RetailOrder`. Các liên kết môn và thư viện ảnh là cấu hình của chi nhánh, được dọn khi xóa chi nhánh trống; ảnh QR/thư viện ảnh được bàn giao cho vòng đời storage hiện có. Không dựa vào cascade để âm thầm xóa dữ liệu nghiệp vụ.
- Dữ liệu nhập sai trả 400; chưa đăng nhập 401; không sở hữu 403; tài nguyên/ID tham chiếu không tồn tại 404; xung đột khi xóa 409. Lỗi cơ sở dữ liệu không được lộ stack trace cho client.

## Kiểm chứng

Giữ nguyên các thay đổi Hotline đang có. Build solution, kiểm tra migration và SQL tạo ra (đặc biệt thứ tự chép dữ liệu trước khi bỏ cột), xác nhận EF model không còn thay đổi chờ migration. Thử API thật qua Scalar với chủ sân hợp lệ: tạo chi nhánh một/hai môn, đọc list/detail, sửa danh sách môn và ảnh, từ chối danh sách môn rỗng/ID sai, chặn đọc-sửa-xóa chi nhánh của người khác, xóa chi nhánh trống, và trả 409 khi đã có dữ liệu nghiệp vụ. Không thêm lại bộ test InMemory mà người dùng đã chủ động bỏ.
