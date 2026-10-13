/**
 * CourtBooking API Endpoints Constants (v1)
 * Khớp chuẩn cấu trúc các Endpoints từ Backend ASP.NET Core API
 */

export const API_ENDPOINTS = {
  // 1. Xác thực & Tài khoản Chủ sân (Court Owner Identities)
  OWNER_AUTH: {
    LOGIN: '/owner/identity/login',
    LOGOUT: '/owner/identity/logout',
    FORGOT_PASSWORD: '/owner/identity/forgot-password',
    RESET_PASSWORD: '/owner/identity/reset-password',
    CHANGE_PASSWORD: '/owner/identity/change-password',
  },

  // 1b. Xác thực & Tài khoản Người chơi (Player Identities)
  AUTH: {
    LOGIN: '/identity/login',
    REGISTER: '/identity/register',
    REFRESH_TOKEN: '/identity/refresh-token',
    LOGOUT: '/identity/logout',
    FORGOT_PASSWORD: '/identity/forgot-password',
    RESET_PASSWORD: '/identity/reset-password',
    CHANGE_PASSWORD: '/identity/change-password',
    ME: '/identity/me',
  },

  // 2. Quản lý Người dùng & Phân quyền (System Admin)
  USERS: {
    LIST: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    CREATE_OWNER: '/users/court-owner',
    UPDATE_STATUS: (id: string) => `/users/${id}/status`,
    DELETE: (id: string) => `/users/${id}`,
  },

  // 3. Chi nhánh & Thông tin VietQR (Branches)
  BRANCHES: {
    // Public
    PUBLIC_SEARCH: '/branches',
    PUBLIC_DETAIL: (id: string) => `/branches/${id}`,
    // Owner
    OWNER_LIST: '/owner/branches',
    OWNER_DETAIL: (id: string) => `/owner/branches/${id}`,
    CREATE: '/owner/branches',
    UPDATE: (id: string) => `/owner/branches/${id}`,
    UPDATE_STATUS: (id: string) => `/owner/branches/${id}/status`,
    DELETE: (id: string) => `/owner/branches/${id}`,
    CONFIG_VIETQR: (id: string) => `/owner/branches/${id}/vietqr`,
    IMAGES: (id: string) => `/owner/branches/${id}/images`,
    POLICIES: (id: string) => `/owner/branches/${id}/policies`,
    GET_ONE_TIME_BOOKING: '/branches/get-one-time-booking',
    OWNER_GET_ONE_TIME_BOOKING: '/owner/branches/get-one-time-booking',
  },

  // 4. Loại sân & Danh sách Sân (CourtTypes & Courts)
  COURTS: {
    COURT_TYPES: '/owner/court-types',
    COURT_TYPE_DETAIL: (id: string) => `/owner/court-types/${id}`,
    CREATE_TYPE: '/owner/court-types',
    UPDATE_TYPE: (id: string) => `/owner/court-types/${id}`,
    DELETE_TYPE: (id: string) => `/owner/court-types/${id}`,
    LIST: '/owner/courts',
    DETAIL: (id: string) => `/owner/courts/${id}`,
    CREATE: '/owner/courts',
    UPDATE: (id: string) => `/owner/courts/${id}`,
    UPDATE_STATUS: (id: string) => `/owner/courts/${id}/status`,
    DELETE: (id: string) => `/owner/courts/${id}`,
  },

  // 5. Bảng giá & Khung giờ cố định (Pricing)
  PRICING: {
    PRICE_TABLES: '/owner/pricing/tables',
    PRICE_TABLE_DETAIL: (id: string) => `/owner/pricing/tables/${id}`,
    PRICE_RULES: '/owner/pricing/rules',
    FIXED_TIME_BLOCKS: '/owner/pricing/fixed-time-blocks',
    BRANCH_CONFIG: '/pricing',
  },

  // 6. Đơn đặt sân & Lưới lịch (Orders & Booking)
  ORDERS: {
    // Owner
    OWNER_TIME_GRID: '/owner/orders/time-grid',
    OWNER_LIST: '/owner/orders',
    OWNER_DETAIL: (id: string) => `/owner/orders/${id}`,
    CONFIRM: (id: string) => `/owner/orders/${id}/confirmation`,
    COMPLETE: (id: string) => `/owner/orders/${id}/completion`,
    CANCEL: (id: string) => `/owner/orders/${id}/cancellation`,
    ADD_PAYMENT: (id: string) => `/owner/orders/${id}/payments`,
    UPDATE_ITEMS: (id: string) => `/owner/orders/${id}/items`,
    UPDATE_CUSTOMER: (id: string) => `/owner/orders/${id}/customer-info`,
    UPDATE_SERVICES: (id: string) => `/owner/orders/${id}/services`,
    CREATE_BY_OWNER: '/owner/orders',
    FIXED_LIST: '/owner/orders/fixed',
    FIXED_DETAIL: (id: string) => `/owner/orders/fixed/${id}`,
    APPROVE_PAYMENT: (id: string) => `/owner/orders/${id}/approve-payment`,
    REJECT_PAYMENT: (id: string) => `/owner/orders/${id}/reject-payment`,
    PROCESS_REFUND: (id: string) => `/owner/orders/${id}/process-refund`,
    CREATE_OFFLINE: '/owner/orders/offline',

    // Player
    CHECK_AVAILABLE_SLOTS: '/orders/available-slots',
    HOLD_SLOT: '/orders/hold',
    CONFIRM_BOOKING: '/orders/confirm',
    CONFIRM_TRANSFER: (id: string) => `/orders/${id}/confirm-transfer`,
    MY_ORDERS: '/orders/my-orders',
    REQUEST_CANCEL: (id: string) => `/orders/${id}/request-cancel`,
  },

  // 7. Sự kiện Giao lưu & Giải đấu (Events)
  EVENTS: {
    PUBLIC_LIST: '/events',
    PUBLIC_DETAIL: (id: string) => `/events/${id}`,
    BUY_TICKETS: (id: string) => `/events/${id}/buy-tickets`,
    MY_TICKETS: '/events/my-tickets',

    // Owner
    OWNER_LIST: '/owner/events',
    CREATE: '/owner/events',
    UPDATE: (id: string) => `/owner/events/${id}`,
    TICKETS_LIST: (id: string) => `/owner/events/${id}/tickets`,
    APPROVE_TICKET: (ticketId: string) => `/owner/events/tickets/${ticketId}/approve`,
    REJECT_TICKET: (ticketId: string) => `/owner/events/tickets/${ticketId}/reject`,
  },

  // 8. Dịch vụ & Loại dịch vụ (Services & ServiceCategories)
  SERVICES: {
    PUBLIC_BY_BRANCH: (branchId: string) => `/services/${branchId}`,
    OWNER_LIST: '/owner/services',
    OWNER_DETAIL: (id: string) => `/owner/services/${id}`,
    CATEGORIES: '/owner/service-categories',
    CATEGORY_DETAIL: (id: string) => `/owner/service-categories/${id}`,
  },

  // 8.1 Bán lẻ POS tại quầy (RetailOrders)
  POS: {
    SERVICE_CATEGORIES: '/owner/service-categories',
    SERVICES: '/owner/services',
    CREATE_ORDER: '/owner/retail-orders',
    ORDER_LIST: '/owner/retail-orders',
    ORDER_DETAIL: (id: string) => `/owner/retail-orders/${id}`,
  },

  // 9. Kèo giao lưu cộng đồng người chơi (Matches)
  MATCHES: {
    LIST: '/matches',
    DETAIL: (id: string) => `/matches/${id}`,
    CREATE: '/matches',
    JOIN: (id: string) => `/matches/${id}/join`,
    APPROVE_PARTICIPANT: (matchId: string, userId: string) =>
      `/matches/${matchId}/participants/${userId}/approve`,
  },

  // 10. Đánh giá & Nhận xét (Reviews)
  REVIEWS: {
    BRANCH_REVIEWS: (branchId: string) => `/branches/${branchId}/reviews`,
    CREATE: '/reviews',
  },

  // 11. Gói cước SaaS & Thuê bao (ServicePackages)
  SUBSCRIPTIONS: {
    PACKAGES: '/service-packages',
    PACKAGE_DETAIL: (id: string) => `/service-packages/${id}`,
    OWNER_SUBSCRIPTION: '/owner/subscriptions',
    SYSTEM_SUBSCRIPTIONS: '/system/subscriptions',
  },

  // 12. Danh mục môn thể thao (SportTypes)
  SPORT_TYPES: {
    LIST: '/sport-types',
    DETAIL: (id: string) => `/sport-types/${id}`,
    ADMIN_LIST: '/admin/sport-types',
    CREATE: '/admin/sport-types',
    UPDATE: (id: string) => `/admin/sport-types/${id}`,
    DELETE: (id: string) => `/admin/sport-types/${id}`,
  },

  // 13. Thống kê & Báo cáo (Analytics)
  ANALYTICS: {
    SYSTEM_DASHBOARD: '/system/analytics/dashboard',
    SYSTEM_REVENUE: '/system/analytics/revenue',
    OWNER_DASHBOARD: (branchId?: string) =>
      branchId ? `/owner/analytics/dashboard?branchId=${branchId}` : '/owner/analytics/dashboard',
    OWNER_REVENUE: '/owner/analytics/revenue',
    OWNER_OCCUPANCY_RATE: '/owner/analytics/occupancy',
  },

  // 14. File Upload (Storage)
  STORAGE: {
    UPLOAD: '/storage/upload',
  },
} as const;
