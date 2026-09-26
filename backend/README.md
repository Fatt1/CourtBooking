��﻿# CourtBooking Backend - Hướng dẫn Cài đặt & Khởi chạy

Tài liệu này hướng dẫn chi tiết cách cấu hình môi trường, chạy cơ sở dữ liệu/hạ tầng và khởi chạy hệ thống Backend dự án **CourtBooking** bằng Docker hoặc chạy trực tiếp trên máy phát triển (Local Debug).

---

## 📌 1. Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, đảm bảo máy tính đã cài đặt:
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0(nếu chạy mã nguồn hoặc debug trên máy host)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/(hỗ trợ Docker Compose v2)
- Visual Studio 2022 (v17.12+/ JetBrains Rider / VS Code với C# Dev Kit

---

## ⚙️ 2. Chuẩn bị & Cấu hình file `.env`

Tất cả các file Docker Compose và cấu hình môi trường đều nằm tại thư mục:
`backend/CourtBooking/`

### Bước 1: Di chuyển vào thư mục dự án
Mở terminal và trỏ vào thư mục:
```bash
cd backend/CourtBooking
```

### Bước 2: Tạo file `.env` từ file mẫu
Dự án đã chuẩn bị sẵn file mẫu [`.env.example`](file:///e:/BookingCourt/backend/CourtBooking/.env.example). Hãy sao chép để tạo file `.env`:

- **Trên Windows PowerShell:**
  ```powershell
  Copy-Item .env.example .env
  ```
- **Trên Linux / macOS / Git Bash:**
  ```bash
  cp .env.example .env
  ```

> ⚠️ **Lưu ý quan trọng**: File `.env` chứa thông tin nhạy cảm (mật khẩu database, API key,...), tuyệt đối **không** commit file `.env` lên Git repository.

### Bước 3: Cấu hình các biến trong file `.env`

Mở file `.env` vừa tạo và cập nhật các thông số cần thiết:

| Tên biến | Mặc định | Mô tả |
| :--- | :--- | :--- |
| `ASPNETCORE_ENVIRONMENT` | `Development` | Môi trường ASP.NET Core (`Development`, `Staging`, `Production`). |
| `API_HTTP_PORT` | `8080` | Port truy cập CourtBooking API từ máy host (`http://localhost:8080`). |
| `MSSQL_SA_PASSWORD` | `CHANGE_ME_Str0ng!Pass` | Mật khẩu tài khoản `sa` của SQL Server. **Bắt buộc** đáp ứng chính sách bảo mật: tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt (ví dụ: `P@ssw0rdCourt2026!`). |
| `MSSQL_DB` | `CourtBooking` | Tên cơ sở dữ liệu chính. |
| `MSSQL_PORT` | `1433` | Port SQL Server expose ra máy host. |
| `MSSQL_PID` | `Developer` | Phiên bản SQL Server (`Developer`, `Express`, `Standard`, `Enterprise`). |
| `ConnectionStrings__DefaultConnection` | *(Được cấu hình sẵn)* | Chuỗi kết nối dùng cho API khi chạy ở máy host (Local Debug). Cần khớp mật khẩu với `MSSQL_SA_PASSWORD`. |
| `SEQ_UI_PORT` | `5341` | Port giao diện Web của Seq UI (`http://localhost:5341`). |
| `SEQ_INGESTION_PORT` | `5342` | Port tiếp nhận log Serilog gửi về Seq (`http://localhost:5342`). |
| `SEQ_API_KEY` | *(để trống)* | API key Seq (để trống khi chạy dev local không cần chứng thực). |

---

## 🚀 3. Hướng dẫn Khởi chạy hệ thống

Hệ thống hỗ trợ **2 kịch bản khởi chạy** thông qua Docker:

```
backend/CourtBooking/
├── docker-compose.infra.yml    # [Kịch bản 1] Chỉ chạy SQL Server & Seq (Dành cho Dev/Debug)
└── docker-compose.yml          # [Kịch bản 2] Chạy full: SQL Server, Seq & CourtBooking API
```

---

### 🔹 Kịch bản 1: Chạy Hạ tầng (Khuyên dùng khi lập trình & Debug)
> **Mục đích**: Chạy SQL Server 2022 và Seq Logging bên trong container Docker, trong khi mã nguồn `CourtBooking.API` được chạy/debug trực tiếp trên Visual Studio, Rider hoặc lệnh `dotnet run`.

#### 1. Khởi động SQL Server & Seq:
Tại thư mục `backend/CourtBooking`:
```bash
docker compose -f docker-compose.infra.yml up -d
```

#### 2. Kiểm tra dịch vụ sẵn sàng:
- **SQL Server 2022**: `localhost:1433`
  - User: `sa`
  - Password: Mật khẩu bạn đã điền ở `MSSQL_SA_PASSWORD` trong file `.env`.
- **Seq Log Server (Web UI)**: [http://localhost:5341](http://localhost:5341)

#### 3. Chạy Backend API trên máy host:
Mở solution `CourtBooking.slnx` bằng Visual Studio / Rider hoặc chạy bằng dòng lệnh:
```bash
dotnet run --project CourtBooking.API
```
API sẽ lắng nghe theo cấu hình trong [`launchSettings.json`](file:///e:/BookingCourt/backend/CourtBooking/CourtBooking.API/Properties/launchSettings.jsonvà kết nối tới SQL Server `localhost:1433`.

#### 4. Dừng hạ tầng khi không dùng:
```bash
docker compose -f docker-compose.infra.yml down
```
*(Nếu muốn xóa sạch dữ liệu database để khởi tạo lại từ đầu, thêm cờ `-v`: `docker compose -f docker-compose.infra.yml down -v`)*

---

### 🔹 Kịch bản 2: Chạy Toàn bộ hệ thống bằng Docker
> **Mục đích**: Đóng gói và chạy toàn bộ gồm **SQL Server**, **Seq** và **CourtBooking.API** bên trong mạng nội bộ Docker. Container API sẽ tự động đợi SQL Server chuyển trạng thái Healthy rồi mới khởi động.

#### 1. Khởi động (kèm build image API):
Tại thư mục `backend/CourtBooking`:
```bash
docker compose up -d --build
```

#### 2. Truy cập các dịch vụ:
- **CourtBooking API**: [http://localhost:8080](http://localhost:8080)
  - Swagger UI / OpenAPI (môi trường Development): [http://localhost:8080/swagger](http://localhost:8080/swagger)
- **Seq Web UI (Theo dõi Log)**: [http://localhost:5341](http://localhost:5341)
- **SQL Server 2022**: `localhost:1433`

#### 3. Xem log thời gian thực:
```bash
# Xem log toàn bộ các container
docker compose logs -f

# Xem log riêng của API
docker compose logs -f courtbooking.api
```

#### 4. Dừng toàn bộ hệ thống:
```bash
docker compose down
```
*(Nếu muốn xóa sạch database volume: `docker compose down -v`)*

---

## 🛠️ 4. EF Core Migration (Cập nhật Database)

Khi có thay đổi về Model/Entity và cần tạo hoặc áp dụng Migration khi chạy ở môi trường phát triển:

### Cài đặt công cụ `dotnet-ef` (nếu chưa có):
```bash
dotnet tool install --global dotnet-ef
```
*(Hoặc restore local tool: `dotnet tool restore`)*

### Tạo Migration mới:
Tại thư mục `backend/CourtBooking`:
```bash
dotnet ef migrations add <TenMigration> --project CourtBooking.Infrastructure --startup-project CourtBooking.API --output-dir Persistence/Migrations
```

### Cập nhật Database:
```bash
dotnet ef database update --project CourtBooking.Infrastructure --startup-project CourtBooking.API
```

---

## 📋 5. Các lệnh thao tác hữu ích khác

- **Kiểm tra trạng thái các container đang chạy:**
  ```bash
  docker compose ps
  ```

- **Khởi động lại một service cụ thể (ví dụ: API):**
  ```bash
  docker compose restart courtbooking.api
  ```

- **Build lại dự án bằng .NET CLI:**
  ```bash
  dotnet build
  ```

- **Chạy toàn bộ Unit / Integration Tests:**
  ```bash
  dotnet test
  ```

---

## ❓ Xử lý sự cố thường gặp (Troubleshooting)

### 1. SQL Server container bị Restart / Thoát liên tục (Exit code 1)
- **Nguyên nhân**: Mật khẩu `sa` không đạt chuẩn bảo mật của Microsoft SQL Server.
- **Khắc phục**: Kiểm tra lại `MSSQL_SA_PASSWORD` trong `.env`. Mật khẩu phải có tối thiểu 8 ký tự, gồm cả chữ hoa, chữ thường, số và ký tự đặc biệt (ví dụ: `Court@Admin2026`).
- **Xem chi tiết lỗi**:
  ```bash
  docker logs courtbooking-sqlserver
  ```

### 2. Xung đột cổng (Port conflict: 1433 hoặc 8080 đã được sử dụng)
- **Nguyên nhân**: Trên máy bạn đã có sẵn SQL Server local hoặc ứng dụng khác chiếm cổng 1433 / 8080.
- **Khắc phục**: Mở file `.env` và đổi port expose sang cổng khác:
  - Ví dụ: `MSSQL_PORT=1434`
  - Khi đó, chuỗi kết nối local sẽ trỏ đến `Server=localhost,1434;...`

### 3. API không kết nối được Database khi chạy qua `docker-compose.yml`
- Trong `docker-compose.yml`, kết nối được thiết lập tự động tới hostname `sqlserver` qua mạng nội bộ Docker (`courtbooking-network`).
- Đảm bảo healthcheck của SQL Server đạt trạng thái `healthy` trước khi API kết nối (đã được cấu hình tự động với `depends_on`)