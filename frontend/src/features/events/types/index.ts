/**
 * Types & DTOs cho các tính năng Sự kiện phía Người chơi (Public Client Events)
 */

export interface BranchImageDto {
  imageId: string;
  key: string;
  displayOrder: number;
}

export interface ImageDto {
  storageKey?: string;
  key?: string;
  id: string;
}

export interface EventCardDto {
  id: string;
  title: string;
  sportTypeId: string;
  sportTypeName: string;
  branchId: string;
  branchName: string;
  branchAddress: string;
  date: string;
  startTime: string;
  endTime: string;
  skillLevelFrom?: string | null;
  skillLevelTo?: string | null;
  ticketPrice: number;
  slots: number;
  availableSlot: number;
  bookedSlots: number;
  status: number; // 0: Open, 1: Full, 2: Closed, 3: Cancelled
  coverImage?: BranchImageDto | null;
}

export interface EventParticipantDto {
  playerId: string;
  fullName: string;
  avatar?: ImageDto | null;
  quantity: number;
  registeredAt: string;
}

export interface EventBranchInfoDto {
  branchId: string;
  branchName: string;
  address: string;
  ggMapUrl?: string | null;
  accountNumber: string;
  accountName: string;
  qrImage?: ImageDto | null;
  images: BranchImageDto[];
}

export interface EventDetailDto {
  id: string;
  title: string;
  description?: string | null;
  sportTypeId: string;
  sportTypeName: string;
  date: string;
  startTime: string;
  endTime: string;
  skillLevelFrom?: string | null;
  skillLevelTo?: string | null;
  ticketPrice: number;
  slots: number;
  availableSlot: number;
  bookedSlots: number;
  status: number;
  branch: EventBranchInfoDto;
  participants: EventParticipantDto[];
}

export interface BookEventTicketPayload {
  quantity: number;
  paymentMethod: number; // 1: BankTransfer / QrTransfer
  proofImageId?: string | null;
}

export interface BookEventTicketResponse {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  branchName: string;
  date: string;
  startTime: string;
  endTime: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: number;
  status: number;
  createdAt: string;
  expiresAt: string;
  accountNumber?: string | null;
  accountName?: string | null;
  qrImage?: ImageDto | null;
}

export interface GetPublicEventsParams {
  search?: string;
  sportTypeId?: string;
  branchId?: string;
  date?: string; // YYYY-MM-DD
  page?: number;
  pageSize?: number;
}
