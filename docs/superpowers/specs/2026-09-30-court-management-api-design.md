# Court Management API Design

**Date:** 2026-09-30  
**Branch:** `feature/court-management-api`  
**Status:** Proposed for review

## 1. Goal

Build the first independent part of the assigned backend work: APIs for sport types, branches, court types, and individual courts. The implementation must follow the repository's existing Minimal API, MediatR/CQRS, FluentValidation, EF Core, `Result<T>`, and storage-event conventions.

This subsystem establishes the catalog data required later by booking, event discovery, pricing, and availability features.

## 2. Scope

### Included

- Admin management of `SportType`.
- Public read APIs for active sport types.
- Court-owner management of `Branch`, including bank/QR data and branch images.
- Public branch listing and branch detail APIs.
- Court-owner management of `CourtType` under an owned branch.
- Court-owner management of `Court` under an owned court type.
- Public reads of active court types and non-inactive courts.
- Authorization, validation, image attachment lifecycle, pagination, filtering, and automated tests.
- Required EF Core migration for missing management fields and uniqueness indexes.

### Explicitly excluded

- Price tables, price rules, fixed time blocks, availability, and booking logic.
- Creating or managing sport events.
- Event listing, event detail, and ticket purchase; these belong to the later `feature/event-ticket-api` branch.
- Authentication endpoint implementation; this design consumes the JWT infrastructure already present.
- Fixing unrelated analyzer warnings or legacy database column spelling.

## 3. Existing Codebase Constraints

- Target framework is .NET 10.
- HTTP endpoints are Minimal APIs implementing `IEndpointGroup` and are discovered automatically by `EndpointExtensions.MapEndpoints()`.
- API paths use `MapApiV1Group` and `/api/v{version:apiVersion}/...`.
- Application operations use MediatR `ICommand`, `IQuery`, and their handlers.
- FluentValidation runs through the existing `ValidationBehavior`.
- Persistence is accessed through `IApplicationDbContext`; handlers do not directly depend on `ApplicationDbContext`.
- Business failures return `Result<T>` with `ValidationError`, `NotFoundError`, `ForbiddenError`, or `ConflictError`.
- Ownership checks reuse `IBranchAuthorizationService`.
- Images are uploaded first through the existing Storage API, then referenced by `ImageId` and attached/deleted through storage events.
- Audit timestamps for `IAuditable` entities are supplied by `AuditInterceptor`.

## 4. Authorization Model

| Capability | Access |
|---|---|
| List active sport types | Anonymous |
| Manage sport types | JWT role `Admin` |
| List/detail active branches | Anonymous |
| Create/list/update own branches | JWT role `CourtOwner` |
| Manage court types in own branch | JWT role `CourtOwner` plus ownership check |
| Manage courts in own branch | JWT role `CourtOwner` plus ownership check |
| Public court type/court reads | Anonymous, active data only |

Endpoint authorization is mandatory even when handlers perform ownership checks. Handlers must not rely on the development fallback currently present in `UserContext` as an authorization mechanism.

## 5. Domain and Persistence Decisions

### 5.1 SportType

Keep the existing fields: `Name`, optional `ImageId`, and `IsActive`.

- Names are unique case-insensitively at the application level.
- Deactivation replaces deletion because branches and events can reference a sport type.
- Updating an image validates that the image exists, attaches the new image, and releases the old image.

### 5.2 Branch

Add `BankName` because the SRS requires the beneficiary bank name, while the entity currently stores only account number, account name, and QR image.

Keep the existing `AccountNumer` database column spelling through EF mapping. Renaming that legacy column is outside this feature.

Branch deletion is not exposed. Owners activate/deactivate branches with `IsActive` so historical orders and related records remain valid.

Image rules:

- `QrImageId` is required.
- Gallery image IDs are optional, distinct, and preserve request order in `DisplayOrder`.
- Create/update validates every image ID before saving.
- `Branch.UpdateImages` determines attached and removed gallery images.
- Attach/delete image events are published only after the database operation succeeds.

### 5.3 CourtType

Keep the current persistence property `MinutesConfig`, but expose it in HTTP DTOs as `MinBookingMinutes` because that is the SRS terminology.

Add `IsActive` with default `true`. Deactivation replaces destructive deletion because court types are referenced by courts, price tables, and fixed schedules.

Enforce a unique court-type name within one branch. The same name may exist in different branches.

### 5.4 Court

Use the existing `CourtStatus` values:

- `Available`
- `Maintenance`
- `Inactive`

Do not expose hard deletion. A court that should no longer accept bookings moves to `Inactive`; temporary closure uses `Maintenance`.

Enforce a unique court name within one court type. Preserve the legacy `CourtTyped` database column mapping.

### 5.5 Migration

Create one migration containing:

- `Branches.BankName`.
- `CourtTypes.IsActive` with default `true`.
- Unique composite index on `(BranchId, Name)` for court types.
- Unique composite index on `(CourtTypeId, Name)` for courts.

Existing seeded branches must receive a non-empty `BankName` before applying a non-null constraint.

## 6. API Contracts

### 6.1 Sport Types

Public:

- `GET /api/v1/sport-types?activeOnly=true`
- `GET /api/v1/sport-types/{id}`

Admin:

- `GET /api/v1/admin/sport-types`
- `POST /api/v1/admin/sport-types`
- `PUT /api/v1/admin/sport-types/{id}`
- `PATCH /api/v1/admin/sport-types/{id}/status`

Create/update accepts `Name`, `ImageId`, and status where appropriate. Public responses never return inactive sport types.

### 6.2 Branches

Public:

- `GET /api/v1/branches?search=&sportTypeId=&province=&district=&page=&pageSize=`
- `GET /api/v1/branches/{id}`

Owner:

- `GET /api/v1/owner/branches?page=&pageSize=`
- `GET /api/v1/owner/branches/{id}`
- `POST /api/v1/owner/branches`
- `PUT /api/v1/owner/branches/{id}`
- `PATCH /api/v1/owner/branches/{id}/status`

Public detail includes sport type, address, map/coordinates, opening hours, policy, QR/bank display data, gallery images ordered by `DisplayOrder`, active court types, and their non-inactive courts. It does not expose internal owner identifiers.

### 6.3 Court Types

Public:

- `GET /api/v1/branches/{branchId}/court-types`

Owner:

- `GET /api/v1/owner/branches/{branchId}/court-types`
- `POST /api/v1/owner/branches/{branchId}/court-types`
- `PUT /api/v1/owner/court-types/{id}`
- `PATCH /api/v1/owner/court-types/{id}/status`

The owner endpoints verify ownership of the parent branch before reading or mutating data.

### 6.4 Courts

Public:

- `GET /api/v1/court-types/{courtTypeId}/courts`

Owner:

- `GET /api/v1/owner/court-types/{courtTypeId}/courts`
- `POST /api/v1/owner/court-types/{courtTypeId}/courts`
- `PUT /api/v1/owner/courts/{id}`
- `PATCH /api/v1/owner/courts/{id}/status`

The owner endpoints resolve the court type to its branch and verify ownership before continuing.

## 7. Validation Rules

### SportType

- `Name`: required, trimmed, maximum 100 characters.
- `ImageId`: when supplied, must reference an existing image.
- Duplicate active or inactive names return 409.

### Branch

- `SportTypeId`: must exist and be active.
- `Name`: required, maximum 255 characters.
- `GgMapUrl`: required, maximum 255 characters, absolute HTTP/HTTPS URL.
- `Province`, `District`, `Street`: required and constrained by the existing EF maximum lengths.
- `Latitude`: optional, between -90 and 90.
- `Longitude`: optional, between -180 and 180.
- `OpenTime` must be earlier than `CloseTime`; overnight hours are not supported in this version.
- `BankName`, `AccountNumber`, and `AccountName`: required and trimmed.
- `QrImageId`: required and must exist.
- Gallery IDs: distinct and all must exist.

### CourtType

- Parent `BranchId`: required and owned by the authenticated owner.
- `Name`: required, maximum 255 characters, unique within the branch.
- `MinBookingMinutes`: greater than zero and no more than 1,440.

### Court

- Parent `CourtTypeId`: required and belongs to a branch owned by the authenticated owner.
- `Name`: required, maximum 255 characters, unique within the court type.
- `Status`: defined `CourtStatus` value only.

## 8. Query and Data-Flow Rules

- All read handlers use `AsNoTracking()`.
- Lists project directly to DTOs rather than loading full entity graphs.
- Paginated endpoints use the existing `PagedList<T>` convention.
- Public queries filter inactive parent resources as well as inactive child resources.
- Owner queries filter by `IUserContext.UserId` and still verify ownership on single-resource access.
- Commands validate referenced records before constructing the aggregate.
- Each command uses one `SaveChangesAsync` call for its database mutation.
- Endpoint request records stay in the API project; commands, queries, handlers, validators, and response DTOs stay in Application.

## 9. Error Semantics

| Condition | HTTP result |
|---|---|
| Invalid request shape/business input | 400 |
| Missing/invalid JWT | 401 |
| Authenticated user lacks role or branch ownership | 403 |
| Resource does not exist or is hidden from public access | 404 |
| Duplicate name or invalid state transition | 409 |

Public endpoints return 404 for inactive single resources instead of revealing that they exist.

## 10. Testing Strategy

Add `tests/CourtBooking.Application.Tests` to the existing solution test folder using the package versions already declared in `Directory.Packages.props`.

Tests cover:

- Validators for all commands.
- Handler success paths and persistence results.
- Role/ownership-sensitive behavior at the application boundary.
- Duplicate-name conflicts.
- Public queries excluding inactive parents and children.
- Branch image ordering and attach/remove calculations.
- Not-found and forbidden distinctions.
- Court status transitions.
- DTO projection names, especially `MinBookingMinutes` mapped from `MinutesConfig`.

Use an isolated EF Core InMemory database per test name. Add the existing `AuditInterceptor` to test options where timestamps are asserted. Endpoint authorization metadata is verified separately from handler tests.

## 11. Delivery Order

1. Add the test project and shared database factory.
2. Add schema fields/indexes and migration.
3. Implement SportType vertically from tests through endpoints.
4. Implement Branch vertically, including image lifecycle.
5. Implement CourtType vertically.
6. Implement Court vertically.
7. Run all tests and build the full solution.
8. Merge this branch before creating `feature/event-ticket-api` from updated `main`.

## 12. Event/Ticket Handoff

The later Event/Ticket design assumes this subsystem provides stable public sport-type and branch data. That branch will separately define public event listing/detail, Player-only ticket purchase, registration deadline storage, server-side price calculation, proof-image handling, and an atomic mechanism preventing overselling.

