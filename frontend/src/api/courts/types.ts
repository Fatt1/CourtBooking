/**
 * Trạng thái sân thể thao
 * 1: Available (Hoạt động)
 * 2: Maintenance (Bảo trì)
 * 3: Inactive (Tạm ngưng)
 */
export enum CourtStatus {
  Available = 1,
  Maintenance = 2,
  Inactive = 3,
}

export interface CourtDto {
  id: string;
  courtTypeId: string;
  courtTypeName: string;
  branchId: string;
  branchName: string;
  name: string;
  status: CourtStatus;
  statusName?: string;
}

export interface GetCourtsParams {
  branchId: string;
  courtTypeId?: string;
  status?: CourtStatus;
  search?: string;
}

export interface CreateCourtRequest {
  courtTypeId: string;
  name: string;
}

export interface UpdateCourtRequest {
  courtTypeId?: string;
  name: string;
}

export interface UpdateCourtStatusRequest {
  status: CourtStatus;
}
