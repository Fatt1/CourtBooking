/**
 * Enums & Types for Orders feature (API v1)
 * Khớp chuẩn với backend CourtBooking.Domain.Enums và Application.Features.V1.Orders.Dtos
 */

export enum OrderStatus {
  AwaitingPayment = 0,       // Đang giữ slot tạm thời (chờ thanh toán)
  PendingConfirmation = 1,   // Khách đã thanh toán / đặt cọc, chờ chủ sân duyệt
  Confirmed = 2,             // Chủ sân đã duyệt, khóa slot
  Completed = 3,             // Đã chơi xong ca đấu
  RequestCancellation = 4,   // Khách xin hủy ca (Chờ duyệt hủy)
  Cancelled = 5,             // Đã hủy đơn
}

export enum OrderType {
  Normal = 0,                // Đơn ngày / vãng lai
  Fixed = 1,                 // Đơn cố định (chu kỳ)
  Event = 2,                 // Sự kiện / Giải đấu
}

export enum OrderChannel {
  Online = 0,                // Đặt qua app / web
  Pos = 1,                   // Tại quầy
}

/**
 * 1 = Tiền mặt, 2 = Chuyển khoản QR (Khớp CourtBooking.Domain.Enums.PaymentMethod)
 */
export enum PaymentMethod {
  Cash = 1,
  QrTransfer = 2,
}

/**
 * 1 = Thanh toán, 2 = Hoàn tiền (Khớp CourtBooking.Domain.Enums.PaymentTransactionType)
 */
export enum PaymentTransactionType {
  Payment = 1,
  Refund = 2,
}

// Map trạng thái sang tiếng Việt và variant badge
export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' | 'info' }> = {
  [OrderStatus.AwaitingPayment]: { label: 'Chờ thanh toán', variant: 'warning' },
  [OrderStatus.PendingConfirmation]: { label: 'Chờ xác nhận', variant: 'warning' },
  [OrderStatus.Confirmed]: { label: 'Đã xác nhận', variant: 'info' },
  [OrderStatus.Completed]: { label: 'Hoàn thành', variant: 'success' },
  [OrderStatus.RequestCancellation]: { label: 'Chờ duyệt hủy', variant: 'danger' },
  [OrderStatus.Cancelled]: { label: 'Đã hủy', variant: 'danger' },
};

export function getOrderStatusLabel(status: OrderStatus | number): string {
  return ORDER_STATUS_MAP[status as OrderStatus]?.label || 'Không xác định';
}

export function getOrderStatusVariant(status: OrderStatus | number): 'success' | 'danger' | 'warning' | 'neutral' | 'info' {
  return ORDER_STATUS_MAP[status as OrderStatus]?.variant || 'neutral';
}

export function getPaymentMethodLabel(method: PaymentMethod | number): string {
  switch (method) {
    case PaymentMethod.Cash:
      return 'Tiền mặt';
    case PaymentMethod.QrTransfer:
      return 'Chuyển khoản QR';
    default:
      return 'Chuyển khoản QR';
  }
}

export function getPaymentTypeLabel(type: PaymentTransactionType | number): string {
  switch (type) {
    case PaymentTransactionType.Payment:
      return 'Thanh toán';
    case PaymentTransactionType.Refund:
      return 'Hoàn tiền';
    default:
      return 'Thanh toán';
  }
}

/**
 * Slot sân trong danh sách đơn ngày
 */
export interface OrderDetailDto {
  courtId: string;
  courtName: string;
  date: string;       // DateOnly string (YYYY-MM-DD)
  startTime: string;  // TimeOnly string (HH:mm:ss hoặc HH:mm)
  endTime: string;    // TimeOnly string (HH:mm:ss hoặc HH:mm)
}

/**
 * Item trong danh sách đơn hàng đặt ngày tại chi nhánh (GET /api/v1/owner/orders)
 */
export interface DailyOrderDto {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  orderType: OrderType;
  orderDate: string;        // YYYY-MM-DD
  totalAmount: number;
  remainingAmount: number;
  paidAmount?: number;
  refundAmount?: number;
  note?: string | null;
  details: OrderDetailDto[];
}

/**
 * Chi tiết slot sân trong DailyOrderResponse
 */
export interface DailyOrderSlotItemDto {
  orderDetailId: string;
  courtId: string;
  courtName: string;
  courtTypeId: string;
  courTypeId?: string;
  courtTypeName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}

/**
 * Chi tiết dịch vụ đính kèm trong DailyOrderResponse
 */
export interface DailyOrderServiceItemDto {
  serviceId: string;
  serviceName: string;
  unit?: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

/**
 * Lịch sử giao dịch thanh toán
 */
export interface PaymentTransactionDto {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  type: PaymentTransactionType;
  imageKey?: string | null;
}

/**
 * Chi tiết đơn hàng ngày đầy đủ (GET /api/v1/owner/orders/{id})
 */
export interface DailyOrderResponse {
  id: string;
  orderCode: string;
  branchId: string;
  branchName: string;
  channel: OrderChannel;
  status: OrderStatus;
  orderType: OrderType;
  orderDate: string;
  createdAt: string;
  holdExpiresAt?: string | null;
  note?: string | null;
  cancelReason?: string | null;

  customerName: string;
  customerPhone: string;
  playerId?: string | null;

  slots: DailyOrderSlotItemDto[];
  services: DailyOrderServiceItemDto[];
  paymentTransactions: PaymentTransactionDto[];

  totalCourtAmount: number;
  totalServiceAmount: number;
  discountAmount: number;
  totalAmount: number;
  remainingAmount: number;
}

import type { PagedList } from '@/types/api';

/**
 * Tham số truy vấn danh sách đơn hàng ngày
 */
export interface GetDailyOrdersParams {
  branchId?: string;
  status?: OrderStatus | number;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Payload hủy đơn bởi chủ sân
 */
export interface CancelOrderByOwnerPayload {
  orderId: string;
  cancelReason: string;
  refundAmount?: number | null;
  refundMethod?: PaymentMethod | null;
}

/**
 * Payload từ chối duyệt hủy đơn bởi chủ sân (trạng thái chuyển về Confirmed)
 */
export interface RejectOrderCancellationPayload {
  orderId: string;
  rejectionReason?: string | null;
}

/**
 * Payload cập nhật thông tin khách hàng
 */
export interface UpdateCustomerInfoPayload {
  orderId: string;
  customerName: string;
  customerPhoneNumber: string;
}

/**
 * Item dịch vụ cập nhật
 */
export interface OrderServiceInputItem {
  serviceId: string;
  quantity: number;
}

/**
 * Payload cập nhật dịch vụ đơn hàng
 */
export interface UpdateOrderServicesPayload {
  orderId: string;
  services: OrderServiceInputItem[];
}

/**
 * Payload thu thêm tiền hoặc hoàn tiền cho đơn hàng (POST /api/v1/owner/orders/{orderId}/payments)
 */
export interface AddPaymentTransactionPayload {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  type?: PaymentTransactionType;
  proofImageId?: string | null;
}

/**
 * Tóm tắt chu kì của đơn lịch cố định (Application.Features.V1.Orders.Dtos.FixedOrderCycleSummaryDto)
 */
export interface FixedOrderCycleSummaryDto {
  cycleId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  daysOfWeekMask?: number;
  daysOfWeek?: string[];
  courtNames?: string[];
}

/**
 * DTO danh sách đơn hàng lịch cố định cho chủ sân (Application.Features.V1.Orders.Dtos.FixedOrderDto)
 */
export interface FixedOrderDto {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  orderType: OrderType;
  orderDate: string;
  totalAmount: number;
  totalCourtAmount: number;
  totalServiceAmount: number;
  remainingAmount: number;
  paidAmount?: number;
  refundAmount?: number;
  discountAmount: number;
  note?: string | null;
  createdAt: string;
  cycles: FixedOrderCycleSummaryDto[];
}

/**
 * Params tìm kiếm danh sách đơn lịch cố định
 */
export interface GetFixedOrdersParams {
  branchId: string;
  status?: OrderStatus;
  fromDate?: string;
  toDate?: string;
  search?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Chi tiết đơn đặt lịch cố định (Application.Features.V1.Orders.Queries.GetFixedOrderById.FixedOrderResponse)
 */
export interface FixedCycleCourtItemDto {
  courtId: string;
  courtName: string;
}

export interface FixedCycleDetailDto {
  cycleId: string;
  courtTypeId: string;
  courtTypeName: string;
  startDate: string;
  endDate: string;
  daysOfWeekMask: number;
  daysOfWeek: number[];
  dayNames: string[];
  startTime: string;
  endTime: string;
  exceptionDates: string[];
  courts: FixedCycleCourtItemDto[];
}

export interface FixedOrderSlotDto {
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

export interface FixedOrderServiceDto {
  serviceId: string;
  serviceName: string;
  unit?: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface FixedOrderResponse {
  id: string;
  orderCode: string;
  branchId: string;
  branchName: string;
  channel: OrderChannel;
  status: OrderStatus;
  orderType: OrderType;
  orderDate: string;
  createdAt: string;
  note?: string | null;
  cancelReason?: string | null;
  customerName: string;
  customerPhone: string;
  playerId?: string | null;
  cycles: FixedCycleDetailDto[];
  slots: FixedOrderSlotDto[];
  services: FixedOrderServiceDto[];
  totalCourtAmount: number;
  totalServiceAmount: number;
  discountAmount: number;
  totalAmount: number;
  remainingAmount: number;
  paymentTransactions: PaymentTransactionDto[];
}

/**
 * Payload ca sân con đặt trực tiếp
 */
export interface CourtSlotItemPayload {
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
}

/**
 * Payload nhóm sân theo loại sân và bảng giá
 */
export interface CourtBookingSlotPayload {
  courtTypeId: string;
  priceTableId?: string | null;
  slots: CourtSlotItemPayload[];
}

/**
 * Payload tạo đơn đặt sân trực tiếp từ chủ sân (POST /api/v1/owner/orders)
 */
export interface CreateOrderByOwnerPayload {
  branchId: string;
  customerName: string;
  customerPhone: string;
  note?: string | null;
  discountAmount?: number;
  paymentMethod: PaymentMethod;
  courtSlots: CourtBookingSlotPayload[];
  services?: OrderServiceInputItem[];
  playerId?: string | null;
}

/**
 * Payload cập nhật các ca sân (OrderDetails / Items) cho đơn hàng
 */
export interface UpdateOrderItemsPayload {
  orderId: string;
  courtBookingSlots: CourtBookingSlotPayload[];
}

/**
 * Chu kỳ đặt cố định (Khớp CourtBooking.Application.Features.V1.Orders.SharedInputs.FixedCycleInput)
 */
export interface FixedCycleInputPayload {
  courtTypeId: string;
  priceTableId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysOfWeekMask: number; // bit 0 = CN, bit 1 = T2, ..., bit 6 = T7
  startTime: string; // HH:mm:ss or HH:mm
  endTime: string; // HH:mm:ss or HH:mm
  courtIds: string[];
  exceptionDates?: string[]; // YYYY-MM-DD
}

/**
 * Payload tạo đơn đặt lịch cố định từ chủ sân (POST /api/v1/owner/orders/fixed)
 */
export interface CreateFixedOrderByOwnerPayload {
  branchId: string;
  customerName: string;
  customerPhone: string;
  note?: string | null;
  discountAmount?: number;
  paymentMethod: PaymentMethod;
  cycles: FixedCycleInputPayload[];
  services?: OrderServiceInputItem[];
}

/**
 * Payload xóa/hủy một ca sân lẻ trong đơn hàng (PUT /api/v1/owner/orders/{orderId}/slots/{orderDetailId}/cancellation)
 */
export interface CancelOrderSlotPayload {
  orderId: string;
  orderDetailId: string;
  refundAmount?: number | null;
  refundMethod?: PaymentMethod | null;
  cancelReason?: string | null;
}

/**
 * Payload thêm các ca sân lẻ vào đơn hàng (POST /api/v1/owner/orders/{orderId}/slots)
 */
export interface AddOrderSlotsPayload {
  orderId: string;
  courtSlots: CourtBookingSlotPayload[];
}

/**
 * Payload thêm chu kì mới vào đơn đặt cố định (POST /api/v1/owner/orders/fixed/{orderId}/cycles)
 */
export interface AddFixedOrderCyclePayload {
  orderId: string;
  courtTypeId: string;
  priceTableId: string;
  startDate: string;
  endDate: string;
  daysOfWeekMask: number;
  startTime: string;
  endTime: string;
  courtIds: string[];
  exceptionDates?: string[];
}

/**
 * Payload cập nhật chu kì đặt cố định (PUT /api/v1/owner/orders/fixed/{orderId}/cycles/{cycleId})
 */
export interface UpdateFixedOrderCyclePayload {
  orderId: string;
  cycleId: string;
  courtTypeId: string;
  priceTableId: string;
  startDate: string;
  endDate: string;
  daysOfWeekMask: number;
  startTime: string;
  endTime: string;
  courtIds: string[];
  exceptionDates?: string[];
}

/**
 * Payload xóa chu kì đặt cố định (DELETE /api/v1/owner/orders/fixed/{orderId}/cycles/{cycleId})
 */
export interface DeleteFixedOrderCyclePayload {
  orderId: string;
  cycleId: string;
}

export interface GetMyOrdersParams {
  status?: OrderStatus;
  page?: number;
  pageSize?: number;
}

/**
 * DTO tóm tắt đơn đặt sân của người chơi trong danh sách (GET /api/v1/orders/my-orders)
 * Handler chỉ trả về thông tin tổng quan và TotalAmount
 */
export interface MyOrderDto {
  id: string;
  orderCode: string;
  branchId: string;
  branchName: string;
  branchAddress: string;
  district?: string;
  province?: string;
  courtName: string;
  sportTypeId?: string;
  sportTypeName?: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: OrderStatus;
  hasSocialMatch: boolean;
  socialMatchId?: string;
  canCreateMatch: boolean;
  holdExpiresAt?: string;
  canPay?: boolean;
  accountNumber?: string | null;
  accountName?: string | null;
  qrCodeImageKey?: string | null;
  hasReviewed?: boolean;
  createdAt?: string;
}

/**
 * Slot sân trong chi tiết đơn đặt sân của người chơi
 */
export interface MyOrderDetailSlotItemDto {
  orderDetailId: string;
  courtId: string;
  courtName: string;
  courtTypeId?: string | null;
  courtTypeName?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}

/**
 * Dịch vụ trong chi tiết đơn đặt sân của người chơi
 */
export interface MyOrderDetailServiceItemDto {
  serviceId: string;
  serviceName: string;
  unit?: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

/**
 * Chi tiết toàn bộ đơn đặt sân của người chơi (GET /api/v1/orders/my-orders/{id})
 */
export interface MyOrderDetailResponse {
  id: string;
  orderCode: string;
  branchId: string;
  branchName: string;
  branchAddress: string;
  branchPhone?: string | null;
  sportTypeName?: string | null;
  status: OrderStatus;
  orderType: OrderType;
  channel: OrderChannel;
  createdAt: string;
  holdExpiresAt?: string | null;
  note?: string | null;
  cancelReason?: string | null;
  customerName: string;
  customerPhone: string;
  totalCourtAmount: number;
  totalServiceAmount: number;
  discountAmount: number;
  totalAmount: number;
  canPay: boolean;
  accountNumber?: string | null;
  accountName?: string | null;
  qrCodeImageKey?: string | null;
  hasSocialMatch: boolean;
  socialMatchId?: string | null;
  canCreateMatch: boolean;
  hasReviewed: boolean;
  reviewRating?: number | null;
  reviewComment?: string | null;
  slots: MyOrderDetailSlotItemDto[];
  services: MyOrderDetailServiceItemDto[];
}

/**
 * Slot sân trong yêu cầu đặt sân online
 */
export interface CourtSlotItemDto {
  courtId: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm:ss
  endTime: string;    // HH:mm:ss
}

/**
 * Nhóm slot theo Loại sân & Bảng giá
 */
export interface CourtBookingSlotDto {
  courtTypeId: string;
  priceTableId?: string | null;
  slots: CourtSlotItemDto[];
}

/**
 * Dịch vụ đính kèm khi đặt sân online
 */
export interface OrderServiceItemDto {
  serviceId: string;
  quantity: number;
}

/**
 * Payload tạo đơn đặt sân online (POST /api/v1/orders)
 */
export interface CreateOrderOnlinePayload {
  branchId: string;
  customerName: string;
  customerPhone: string;
  note?: string;
  courtSlots: CourtBookingSlotDto[];
  services?: OrderServiceItemDto[];
  playerId?: string | null;
}

/**
 * Kết quả trả về sau khi tạo đơn online
 */
export interface CreateOrderOnlineResponse {
  qrCodeImageKey: string;
  orderId: string;
  orderCode: string;
  totalAmount: number;
  holdExpiresAt: string; // ISO 8601 string
  accountNumber?: string | null;
  accountName?: string | null;
}

/**
 * Payload nộp ảnh chứng nhận thanh toán (PUT /api/v1/orders/{id}/payment-proof)
 */
export interface SubmitPaymentProofPayload {
  orderId: string;
  imageId: string;
}

/**
 * Payload hủy đơn online đang chờ thanh toán (PUT /api/v1/orders/{id}/cancel)
 */
export interface CancelOrderOnlinePayload {
  orderId: string;
  reason?: string;
}



