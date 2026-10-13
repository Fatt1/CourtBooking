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
  discountAmount: number;
  note?: string | null;
  createdAt: string;
  cycles: FixedOrderCycleSummaryDto[];
}

