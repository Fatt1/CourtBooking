import type { CourtBookingSlotPayload } from '@/api/orders/types';

/**
 * Trạng thái sự kiện thể thao:
 * 0 = Open (Đang mở đăng ký), 1 = Full (Đóng đăng ký / Đã đầy), 2 = Closed (Đã kết thúc), 3 = Cancelled (Đã hủy)
 */
export enum EventStatus {
  Open = 0,
  Full = 1,
  Closed = 2,
  Cancelled = 3,
}

/**
 * Trạng thái vé tham gia sự kiện:
 * 0 = AwaitingPayment (Chờ thanh toán), 1 = PendingApproval (Chờ duyệt), 2 = Confirmed (Đã xác nhận), 3 = Cancelled (Đã hủy)
 */
export enum EventTicketStatus {
  AwaitingPayment = 0,
  PendingApproval = 1,
  Confirmed = 2,
  Cancelled = 3,
}

/**
 * Phương thức thanh toán vé:
 * 1 = Cash, 2 = QrTransfer
 */
export enum PaymentMethodEnum {
  Cash = 1,
  QrTransfer = 2,
  BankTransfer = 2,
}

export interface EventProofImageDto {
  key?: string;
  storageKey?: string;
  id: string;
}

/**
 * DTO từng dòng vé trong modal "Người tham gia"
 */
export interface EventParticipantItemDto {
  ticketId: string;
  playerId: string;
  playerName: string;
  playerPhone?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: PaymentMethodEnum;
  status: EventTicketStatus;
  proofImage?: EventProofImageDto | null;
  refundNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

/**
 * DTO tổng hợp dữ liệu modal "Người tham gia: [Tên Sự Kiện]"
 */
export interface EventParticipantsResponse {
  eventId: string;
  eventTitle: string;
  totalRevenue: number;
  totalSlots: number;
  soldSlots: number;
  participants: EventParticipantItemDto[];
}

export interface CourtSummaryDto {
  courtId: string;
  courtName: string;
}

/**
 * DTO từng dòng trong bảng sự kiện của Chủ sân (GET /api/v1/owner/events)
 */
export interface OwnerEventItemDto {
  id: string;
  eventCode: string;
  title: string;
  courts: CourtSummaryDto[];
  date?: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  slots: number;
  soldTickets: number;
  availableSlot: number;
  ticketPrice: number;
  estimatedRevenue: number;
  status: EventStatus;
  skillLevelFrom?: string | null;
  skillLevelTo?: string | null;
}

export interface OwnerEventSlotDetailDto {
  orderDetailId: string;
  courtId: string;
  courtName: string;
  courtTypeId: string;
  courtTypeName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}

/**
 * DTO chi tiết sự kiện nạp vào modal (GET /api/v1/owner/events/{id})
 */
export interface OwnerEventDetailDto {
  id: string;
  orderId: string;
  orderCode: string;
  branchId: string;
  branchName: string;
  customerName?: string | null;
  customerPhone?: string | null;
  note?: string | null;
  title: string;
  sportTypeId: string;
  sportTypeName: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  ticketPrice: number;
  slots: number;
  availableSlot: number;
  soldTickets: number;
  skillLevelFrom?: string | null;
  skillLevelTo?: string | null;
  description?: string | null;
  status: EventStatus;
  courtIds: string[];
  courts: CourtSummaryDto[];
  slotDetails?: OwnerEventSlotDetailDto[];
}

/**
 * Tham số truy vấn danh sách sự kiện chi nhánh
 */
export interface GetOwnerEventsParams {
  branchId: string;
  sportTypeId?: string;
  status?: EventStatus;
  date?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Payload tạo sự kiện mới (POST /api/v1/owner/events)
 */
export interface CreateEventPayload {
  branchId: string;
  title: string;
  sportTypeId: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  startDate?: string;
  endDate?: string;
  ticketPrice: number;
  slots: number;
  courtSlots: CourtBookingSlotPayload[];
  skillLevelFrom?: string | null;
  skillLevelTo?: string | null;
  description?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  note?: string | null;
}

/**
 * Payload cập nhật thông tin sự kiện (PUT /api/v1/owner/events/{id})
 */
export interface UpdateEventPayload {
  title: string;
  sportTypeId: string;
  ticketPrice: number;
  slots: number;
  status: EventStatus;
  skillLevelFrom?: string | null;
  skillLevelTo?: string | null;
  description?: string | null;
  note?: string | null;
}

/**
 * Payload hủy sự kiện (PUT /api/v1/owner/events/{id}/cancel)
 */
export interface CancelEventPayload {
  reason: string;
}
