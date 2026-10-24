export interface CreateRetailOrderPayload {
  branchId: string;
  discountAmount: number;
  items: { serviceId: string; quantity: number }[];
}

export interface RetailOrderItemDto {
  serviceId: string;
  serviceName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface RetailOrderDto {
  id: string;
  orderCode: string;
  branchId: string;
  branchName: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  orderDate: string;
  createdAt: string;
  items: RetailOrderItemDto[];
}

export interface RetailOrderListItemDto {
  id: string;
  orderCode: string;
  branchId: string;
  branchName: string;
  totalQuantity: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  orderDate: string;
  createdAt: string;
}

export interface RetailOrderSummaryDto {
  totalOrders: number;
  totalItems: number;
  grossRevenue: number;
  totalDiscount: number;
  netRevenue: number;
}

export interface RetailOrderFilters {
  branchId: string;
  fromDate: string;
  toDate: string;
  search?: string;
}
