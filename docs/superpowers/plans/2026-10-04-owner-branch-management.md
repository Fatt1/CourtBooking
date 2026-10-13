# Owner Branch Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chủ sân quản lý chi nhánh của mình; mỗi chi nhánh có ít nhất một môn và có thể có nhiều môn.

**Architecture:** Thay khóa ngoại đơn `Branch.SportTypeId` bằng entity liên kết `BranchSportType`, migration bảo toàn dữ liệu cũ, rồi triển khai năm Minimal API Owner qua CQRS/MediatR và quyền theo JWT. Giữ nguyên Court/CourtType, giá thuê và đặt sân.

**Tech Stack:** .NET 10, ASP.NET Core Minimal API, MediatR, FluentValidation, EF Core SQL Server, Scalar.

**Spec:** `docs/superpowers/specs/2026-10-04-owner-branch-management-design.md`

## Global Constraints

- Không sửa Court/CourtType hay thêm API công khai cho khách trong đợt này.
- `POST`/`PUT` bắt buộc có `sportTypeIds` không rỗng; `ggMapUrl`, `qrImageId`, `accountNumber`, `accountName` vẫn bắt buộc.
- Chỉ JWT role `CourtOwner`; owner ID lấy từ `IUserContext.UserId`, không nhận từ client. Header `X-User-Id` không thay thế được xác thực.
- `DELETE` chỉ xóa chi nhánh chưa có dữ liệu nghiệp vụ; nếu có trả 409.
- Giữ nguyên migration Hotline đang có và các thay đổi chưa commit của người dùng. Không reset, không commit/push nếu người dùng chưa yêu cầu.
- Không tạo lại test InMemory. Mỗi task có bước kiểm tra bằng build, SQL migration và/hoặc API thật. Kịch bản Owner cần JWT hợp lệ; nếu chưa có token, ghi rõ chưa kiểm chứng được thay vì tuyên bố đã pass.
- Trước lệnh build/migration cần dừng tiến trình CourtBooking.API đang chạy để tránh khóa DLL. Không chạy migration lên database thật cho tới khi đã xem SQL và xác định đúng kết nối.

## File Map

- Domain/persistence: `CourtBooking.Domain/Entities/Courts/{Branch,SportType,BranchSportType}.cs`, `CourtBooking.Infrastructure/Configurations/{Branch,SportType,BranchSportType}Configuration.cs`, hai `IApplicationDbContext`/`ApplicationDbContext`, `DatabaseSeeder`, migration và snapshot.
- Ảnh hưởng hiện có: `GetAdminSportTypesHandler.cs` và `DeleteSportTypeHandler.cs`.
- Branch feature mới: `CourtBooking.Application/Features/V1/Branches/{Dtos,Queries,Commands}`; mỗi query/command có handler riêng, command nhập liệu có validator.
- HTTP: `CourtBooking.API/Endpoints/V1/Branches/BranchEndpoints.cs` và request records cùng thư mục. Không sửa `Program.cs` vì `MapEndpoints()` tự khám phá `IEndpointGroup`.

## Review Focus

1. `sportTypeIds` trùng hoặc rỗng phải bị từ chối 400, không tạo hàng liên kết trùng (Task 3/4).
2. ID môn/ảnh không tồn tại phải trả lỗi có kiểm soát, không thành 500 do FK (Task 3/4).
3. Tài khoản CourtOwner A không đọc/sửa/xóa chi nhánh của B; không dùng `X-User-Id` để vượt JWT (Task 2/4/5).
4. Chi nhánh mở qua nửa đêm, ví dụ `18:00`–`02:00`, không bị validator bác chỉ vì giờ đóng nhỏ hơn giờ mở (Task 3/4).
5. Xóa chi nhánh có `CourtType`, dịch vụ, đánh giá hoặc lịch sử đơn phải trả 409 và giữ nguyên dữ liệu; ảnh QR dùng ở nơi khác không bị đánh dấu Deleted (Task 5).

---

### Task 1: Quan hệ nhiều môn và migration bảo toàn dữ liệu

**Files:**
- Create: `backend/CourtBooking/CourtBooking.Domain/Entities/Courts/BranchSportType.cs`
- Create: `backend/CourtBooking/CourtBooking.Infrastructure/Configurations/BranchSportTypeConfiguration.cs`
- Generate: `backend/CourtBooking/CourtBooking.Infrastructure/Migrations/*_AddBranchSportTypes.cs` và `*_AddBranchSportTypes.Designer.cs` (EF cấp tiền tố thời gian lúc chạy lệnh)
- Modify: `backend/CourtBooking/CourtBooking.Domain/Entities/Courts/Branch.cs`, `SportType.cs`
- Modify: `backend/CourtBooking/CourtBooking.Infrastructure/Configurations/BranchConfiguration.cs`, `SportTypeConfiguration.cs`
- Modify: `backend/CourtBooking/CourtBooking.Application/Data/IApplicationDbContext.cs`, `backend/CourtBooking/CourtBooking.Infrastructure/Database/ApplicationDbContext.cs`, `DatabaseSeeder.cs`, `Migrations/ApplicationDbContextModelSnapshot.cs`
- Modify: `backend/CourtBooking/CourtBooking.Application/Features/V1/SportTypes/Queries/GetAdminSportTypes/GetAdminSportTypesHandler.cs`, `Commands/DeleteSportType/DeleteSportTypeHandler.cs`

**Interfaces:** Produce `BranchSportType` with `Guid BranchId`, `Guid SportTypeId`, `Branch Branch`, `SportType SportType`; `IApplicationDbContext.BranchSportTypes : DbSet<BranchSportType>`. `Branch.BranchSportTypes` and `SportType.BranchSportTypes` replace the old direct navigation/FK. Later tasks use these collections and DbSet.

- [ ] **Step 1: Baseline check.** In `backend/CourtBooking`, stop API and run `dotnet build CourtBooking.slnx`; note existing warnings separately. Confirm the Hotline migration and snapshot are present, without editing them.
- [ ] **Step 2: Update model/configuration.** Configure composite PK `(BranchId, SportTypeId)`, FK Branch cascade, FK SportType restrict. Replace old navigation/FK/index, add DbSet, and update seeder/admin count/sport deletion to use the join. `dotnet build CourtBooking.slnx` must have zero errors.
- [ ] **Step 3: Generate and correct migration.** Run `dotnet ef migrations add AddBranchSportTypes --project CourtBooking.Infrastructure --startup-project CourtBooking.API`. In `Up`, create join table, insert `(Id, SportTypeId)` from every existing Branch, then drop old FK/index/column. In `Down`, abort with clear SQL error if any branch has other than exactly one sport; otherwise restore non-null `SportTypeId` from the join before dropping it. Preserve migration `AddBranchHotline` as an earlier migration.
- [ ] **Step 4: Inspect migration output.** Run `dotnet ef migrations script --idempotent --project CourtBooking.Infrastructure --startup-project CourtBooking.API` and inspect the generated SQL for insert-before-drop, both FKs and rollback guard. Run `dotnet ef migrations has-pending-model-changes --project CourtBooking.Infrastructure --startup-project CourtBooking.API`; expected no pending changes. Do not apply to a database yet.
- [ ] **Step 5: Check diff.** `git diff --check`; inspect that no Court/CourtType or booking files changed.

### Task 2: Owner GET danh sách và chi tiết

**Files:**
- Create: `backend/CourtBooking/CourtBooking.Application/Features/V1/Branches/Dtos/BranchDtos.cs`
- Create: `backend/CourtBooking/CourtBooking.Application/Features/V1/Branches/Queries/GetOwnerBranches/{GetOwnerBranchesQuery,GetOwnerBranchesHandler}.cs`
- Create: `backend/CourtBooking/CourtBooking.Application/Features/V1/Branches/Queries/GetOwnerBranchById/{GetOwnerBranchByIdQuery,GetOwnerBranchByIdHandler}.cs`
- Create: `backend/CourtBooking/CourtBooking.API/Endpoints/V1/Branches/BranchEndpoints.cs`

**Interfaces:** `GetOwnerBranchesQuery : IQuery<IReadOnlyList<OwnerBranchListItemDto>>`; `GetOwnerBranchByIdQuery(Guid Id) : IQuery<OwnerBranchDetailDto>`. DTOs include `BranchSportDto(Guid Id, string Name)` and `BranchImageDto(Guid Id, string Key)`. List DTO contains address, hotline, hours, status, sports, first gallery image, review count/average; detail DTO additionally contains map/coordinates, policy, QR, account data, ordered gallery. Read handlers filter owner ID from `IUserContext`.

- [ ] **Step 1: Red check.** With API running, an authenticated `GET /api/v1/owner/branches` has no endpoint before implementation; record the actual 404. If no Owner JWT exists, record the blocked authenticated check and continue build-only work.
- [ ] **Step 2: Add DTOs and queries.** Return all owner branches (including inactive); `GetById` returns 404 if absent and 403 if present but belongs to another owner. Compute review count/average from Reviews. Return image `{id,key}` and ordered gallery; never return another owner's account data.
- [ ] **Step 3: Map Owner GET routes.** Require role `CourtOwner` at route group level; annotate 200/401/403/404 responses and Vietnamese summaries. `Program.cs` stays unchanged.
- [ ] **Step 4: Green check.** `dotnet build CourtBooking.slnx` succeeds. With a valid JWT and migrated local DB, GET list/detail return 200 and correct sports/images; no JWT returns 401; another owner's branch returns 403. If authenticated testing is unavailable, do not mark the live checks passed.

### Task 3: Owner POST thêm chi nhánh

**Files:**
- Create: `backend/CourtBooking/CourtBooking.Application/Features/V1/Branches/Commands/CreateBranch/{CreateBranchCommand,CreateBranchValidator,CreateBranchHandler}.cs`
- Create: `backend/CourtBooking/CourtBooking.API/Endpoints/V1/Branches/CreateBranchRequest.cs`
- Modify: `backend/CourtBooking/CourtBooking.Domain/Entities/Courts/Branch.cs`
- Modify: `backend/CourtBooking/CourtBooking.API/Endpoints/V1/Branches/BranchEndpoints.cs`

**Interfaces:** `CreateBranchCommand : ICommand<Guid>` mang trực tiếp các trường `string Name, Hotline, Province, District, Street, GgMapUrl, AccountNumber, AccountName`, `TimeOnly OpenTime, CloseTime`, `Guid QrImageId`, `IReadOnlyList<Guid> SportTypeIds`, `string? Policy`, `decimal? Latitude, Longitude`, và `IReadOnlyList<Guid>? ImageIds`. `CreateBranchRequest` có cùng trường người dùng được sửa, không có owner/ID/audit/status. Handler lấy `CourtOwnerId` từ `IUserContext.UserId`.

- [ ] **Step 1: Red check.** Before mapping POST, call `POST /api/v1/owner/branches` with valid Owner JWT and complete JSON; record 404, or record missing JWT as an unverified prerequisite.
- [ ] **Step 2: Add validator.** Reject empty/whitespace required strings, lengths from the spec, empty/duplicate SportType IDs, duplicate gallery IDs, empty GUIDs, and equal opening/closing time. `18:00`–`02:00` must remain valid.
- [ ] **Step 3: Add handler.** Confirm all sports and images exist before save; create Branch and join/gallery rows with stable image order; ensure `Branch.UpdateImages` assigns a nonempty ID to each new `BranchImage` because its EF key is `ValueGeneratedNever`. Use existing attach event for QR/gallery after SaveChanges, deduplicating image IDs. Set `IsActive = true`; rely on audit interceptor for timestamps.
- [ ] **Step 4: Map POST.** Return 201 with new ID and `/api/v1/owner/branches/{id}` Location; document 400/401/404.
- [ ] **Step 5: Green checks.** Build succeeds. On migrated local DB and valid Owner JWT: one/two sports => 201, GET detail shows both; empty/duplicate sports => 400; missing SportType/Image => controlled 404; overnight hours accepted. No InMemory test files.

### Task 4: Owner PUT sửa chi nhánh

**Files:**
- Create: `backend/CourtBooking/CourtBooking.Application/Features/V1/Branches/Commands/UpdateBranch/{UpdateBranchCommand,UpdateBranchValidator,UpdateBranchHandler}.cs`
- Create: `backend/CourtBooking/CourtBooking.API/Endpoints/V1/Branches/UpdateBranchRequest.cs`
- Modify: `backend/CourtBooking/CourtBooking.API/Endpoints/V1/Branches/BranchEndpoints.cs`

**Interfaces:** `UpdateBranchCommand(Guid Id, ...) : ICommand` mang trực tiếp các trường như command tạo; `PUT /api/v1/owner/branches/{id}` thay toàn bộ trường có thể sửa, liên kết môn và thứ tự ảnh. Validator/handler nằm trong từng thư mục command, theo cấu trúc hiện có của nhóm.

- [ ] **Step 1: Red check.** Before mapping PUT, call it on an owned local Branch with complete JSON; record 404 or the missing-JWT prerequisite.
- [ ] **Step 2: Validate and authorize.** Apply same input rules as create plus nonempty route ID; load branch and distinguish not-found (404) from not-owned (403) before mutation.
- [ ] **Step 3: Implement replacement.** Validate reference IDs; diff sport links and gallery images (reuse `Branch.UpdateImages`), update scalars/QR, SaveChanges, then attach added images and release removed images through existing events. Never remove a sport link if it would leave no sports.
- [ ] **Step 4: Map PUT and verify.** Return 204; build succeeds. Live checks: switching one sport to two reflects in GET/admin count; empty sports 400; other owner's Branch 403; unchanged QR/gallery IDs are not released; `18:00`–`02:00` accepted.

### Task 5: Owner DELETE an toàn

**Files:**
- Create: `backend/CourtBooking/CourtBooking.Application/Features/V1/Branches/Commands/DeleteBranch/{DeleteBranchCommand,DeleteBranchHandler}.cs`
- Modify: `backend/CourtBooking/CourtBooking.API/Endpoints/V1/Branches/BranchEndpoints.cs`

**Interfaces:** `DeleteBranchCommand(Guid Id) : ICommand`; handler returns `NotFoundError`, `ForbiddenError`, or `ConflictError` before any deletion; success returns `Result.Success()`.

- [ ] **Step 1: Red check.** Before mapping DELETE, call route against disposable empty local Branch; record 404 or missing-JWT prerequisite.
- [ ] **Step 2: Implement guard.** Check `CourtTypes`, `ServiceBranches`, `Reviews`, `Orders`, `SocialMatches`, `RetailOrders` for matching BranchId. Any hit => 409 and no mutation. Then remove branch plus sport/gallery links without relying on cascades that remove business data.
- [ ] **Step 3: Handle images and endpoint.** After successful save, release QR/gallery images only if no remaining references; never mark an image Deleted while another entity still references it. Map DELETE to 204 and document 401/403/404/409.
- [ ] **Step 4: Green checks.** Build succeeds. Live checks: empty Branch => 204, repeat => 404; each related-data category => 409 with rows intact; other owner's Branch => 403; image shared elsewhere remains usable.

### Task 6: End-to-end review and handoff

**Files:** None unless verification exposes an in-scope defect.

**Interfaces:** All five routes and the migration from Tasks 1–5.

- [ ] **Step 1: Verify repository state.** Run `git diff --check` and `dotnet build CourtBooking.slnx` from `backend/CourtBooking`; report warnings separately from errors. Confirm `Court.cs`, `CourtType.cs`, booking/price code and `Program.cs` were not changed.
- [ ] **Step 2: Review database target.** Confirm local development connection/containers and inspect migration SQL. Only then run API, which calls `DatabaseInitializer.ApplyMigrationsAndSeedAsync` on startup. Never point smoke tests at production.
- [ ] **Step 3: Execute Scalar matrix.** With valid Owner JWT, exercise GET/POST/PUT/DELETE success and 400/401/403/404/409 cases from Tasks 2–5; inspect persisted Branch–SportType rows and original seeded sport links. If no token issuance path is available in this repo, report authenticated scenarios as unverified and request a valid test JWT rather than bypassing authorization.
- [ ] **Step 4: Report result.** Summarize changed files, migration behavior, actual commands/statuses observed, any unverified scenarios and manual next steps. Do not commit/push unless the user asks.
