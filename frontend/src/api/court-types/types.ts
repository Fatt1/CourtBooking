/**
 * Court Types DTOs & Payloads
 * Khớp chuẩn cấu trúc trả về từ CourtTypeEndpoints.cs
 */

export interface CourtTypeDto {
  id: string;
  branchId: string;
  name: string;
  minutesConfig: number;
  courtCount: number;
}

export interface CreateCourtTypePayload {
  branchId: string;
  name: string;
  minutesConfig: number;
}

export interface UpdateCourtTypePayload {
  id: string;
  name: string;
  minutesConfig: number;
}
