/**
 * Enums & Types cho tính năng Kèo giao lưu (Social Matches API v1)
 * Khớp chuẩn Domain backend và DTOs
 */

export enum SocialMatchStatus {
  Open = 0,       // Đang mở, nhận người
  Full = 1,       // Đã đủ người
  Closed = 2,     // Đã kết thúc
  Cancelled = 3,  // Đã hủy kèo
}

export enum ParticipantStatus {
  PendingApproval = 0,  // Chờ chủ phòng duyệt
  Confirmed = 1,        // Đã tham gia (chính thức)
  Rejected = 2,         // Bị từ chối
  Cancelled = 3,        // Đã rút lui / Hủy
}

export enum ApprovalMode {
  Auto = 0,    // Tự động nhận khi còn chỗ
  Manual = 1,  // Chủ phòng duyệt
}

export interface MatchDto {
  id: string;
  orderId: string;
  branchId: string;
  branchName: string;
  branchAddress: string;
  sportTypeId: string;
  sportTypeName: string;
  date: string;
  startTime: string;
  endTime: string;
  hostId: string;
  hostName: string;
  skillLevel?: string | null;
  missingPlayers: number;
  availableSlots: number;
  feePerPlayer: number;
  approvalMode: number;
  status: SocialMatchStatus;
  description?: string | null;
  createdAt: string;
  confirmedParticipantsCount: number;
}

export interface MatchParticipantDto {
  id: string;
  playerId: string;
  playerName: string;
  status: ParticipantStatus;
  joinedAt: string;
  isHost: boolean;
}

export interface MatchDetailDto {
  id: string;
  orderId: string;
  orderCode: string;
  branchId: string;
  branchName: string;
  branchAddress: string;
  sportTypeId: string;
  sportTypeName: string;
  date: string;
  startTime: string;
  endTime: string;
  hostId: string;
  hostName: string;
  skillLevel?: string | null;
  missingPlayers: number;
  availableSlots: number;
  feePerPlayer: number;
  approvalMode: number;
  status: SocialMatchStatus;
  description?: string | null;
  createdAt: string;
  participants: MatchParticipantDto[];
}

export interface GetMatchesParams {
  sportTypeId?: string;
  date?: string;
  province?: string;
  district?: string;
  skillLevel?: string;
  status?: SocialMatchStatus;
  page?: number;
  pageSize?: number;
}

export interface CreateMatchPayload {
  orderId: string;
  skillLevel?: string;
  missingPlayers: number;
  feePerPlayer: number;
  approvalMode: number;
  description?: string;
}

export interface UpdateMatchPayload {
  id: string;
  skillLevel?: string;
  missingPlayers: number;
  feePerPlayer: number;
  approvalMode: number;
  description?: string;
}

export interface CreateMatchResponse {
  matchId: string;
}

export interface JoinMatchResponse {
  participantId: string;
}
