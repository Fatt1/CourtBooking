import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OwnerNotificationItem {
  id: string;
  type: 'ORDER' | 'EVENT_TICKET';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  orderId?: string;
  orderCode?: string;
  eventId?: string;
  ticketId?: string;
  customerName?: string;
  playerName?: string;
  totalAmount?: number;
  branchId?: string;
  branchName?: string;
}

interface NotificationState {
  notifications: OwnerNotificationItem[];
  addNotification: (item: Omit<OwnerNotificationItem, 'id' | 'createdAt' | 'isRead'> & { id?: string; createdAt?: string }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (item) => {
        const newItem: OwnerNotificationItem = {
          id: item.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: item.type,
          title: item.title,
          message: item.message,
          createdAt: item.createdAt || new Date().toISOString(),
          isRead: false,
          orderId: item.orderId,
          orderCode: item.orderCode,
          eventId: item.eventId,
          ticketId: item.ticketId,
          customerName: item.customerName,
          playerName: item.playerName,
          totalAmount: item.totalAmount,
          branchId: item.branchId,
          branchName: item.branchName,
        };

        set((state) => ({
          // Giữ tối đa 50 thông báo gần nhất để tránh phình dung lượng LocalStorage
          notifications: [newItem, ...state.notifications].slice(0, 50),
        }));
      },

      markAsRead: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }));
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length;
      },
    }),
    {
      name: 'court_owner_notifications', // key lưu trữ trong LocalStorage
    }
  )
);
