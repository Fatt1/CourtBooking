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

  // 1c. Xác thực & Tài khoản Quản trị viên (Admin Identities)
  ADMIN_AUTH: {
    LOGIN: '/admin/identity/login',
    LOGOUT: '/admin/identity/logout',
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
    GET_FROM_TIME_BOOKING: '/branches/get-from-time-booking',
    OWNER_GET_FROM_TIME_BOOKING: '/owner/branches/get-from-time-booking',
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
    OWNER_CONFIG: '/owner/pricing',
    BRANCH_CONFIG: '/pricing',
    PRICE_TABLES: '/owner/pricing/price-tables',
    PRICE_TABLE_DETAIL: (id: string) => `/owner/pricing/price-tables/${id}`,
    PRICE_RULES: (tableId: string) => `/owner/pricing/price-tables/${tableId}/rules`,
    PRICE_RULE_DETAIL: (tableId: string, ruleId: string) =>
      `/owner/pricing/price-tables/${tableId}/rules/${ruleId}`,
    FIXED_TIME_BLOCKS: '/owner/pricing/fixed-time-blocks',
    FIXED_TIME_BLOCK_DETAIL: (blockId: string) =>
      `/owner/pricing/fixed-time-blocks/${blockId}`,
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
    CANCEL_SLOT: (orderId: string, orderDetailId: string) =>
      `/owner/orders/${orderId}/slots/${orderDetailId}/cancellation`,
    ADD_SLOTS: (orderId: string) => `/owner/orders/${orderId}/slots`,
    CREATE_BY_OWNER: '/owner/orders',
    FIXED_LIST: '/owner/orders/fixed',
    FIXED_DETAIL: (id: string) => `/owner/orders/fixed/${id}`,
    ADD_FIXED_CYCLE: (orderId: string) => `/owner/orders/fixed/${orderId}/cycles`,
    UPDATE_FIXED_CYCLE: (orderId: string, cycleId: string) =>
      `/owner/orders/fixed/${orderId}/cycles/${cycleId}`,
    DELETE_FIXED_CYCLE: (orderId: string, cycleId: string) =>
      `/owner/orders/fixed/${orderId}/cycles/${cycleId}`,
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
    MY_ORDER_DETAIL: (id: string) => `/orders/my-orders/${id}`,
    REQUEST_CANCEL: (id: string) => `/orders/${id}/request-cancel`,
    CREATE_ONLINE: '/orders',
    SUBMIT_PAYMENT_PROOF: (id: string) => `/orders/${id}/payment-proof`,
    CANCEL_ONLINE: (id: string) => `/orders/${id}/cancel`,
  },

  // 7. Sự kiện Giao lưu & Giải đấu (Events)
  EVENTS: {
    PUBLIC_LIST: '/events',
    PUBLIC_DETAIL: (id: string) => `/events/${id}`,
    BUY_TICKETS: (id: string) => `/events/${id}/tickets`,
    CANCEL_TICKET: (id: string, ticketId: string) => `/events/${id}/tickets/${ticketId}/cancel`,
    MY_TICKETS: '/events/my-tickets',

    // Owner
    OWNER_LIST: '/owner/events',
    DETAIL: (id: string) => `/owner/events/${id}`,
    CREATE: '/owner/events',
    UPDATE: (id: string) => `/owner/events/${id}`,
    CANCEL: (id: string) => `/owner/events/${id}/cancel`,
    PARTICIPANTS: (id: string) => `/owner/events/${id}/participants`,
    TICKETS_LIST: (id: string) => `/owner/events/${id}/tickets`,
    APPROVE_TICKET: (id: string, ticketId: string) => `/owner/events/${id}/tickets/${ticketId}/approve`,
    REJECT_TICKET: (id: string, ticketId: string) => `/owner/events/${id}/tickets/${ticketId}/reject`,
  },

  // 8. Dịch vụ & Loại dịch vụ (Services & ServiceCategories)
  SERVICES: {
    PUBLIC_BY_BRANCH: (branchId: string) => `/services/${branchId}`,
    OWNER_LIST: '/owner/services',
    OWNER_DETAIL: (id: string) => `/owner/services/${id}`,
    CREATE: '/owner/services',
    UPDATE: (id: string) => `/owner/services/${id}`,
    UPDATE_STATUS: (id: string, branchId: string) => `/owner/services/${id}/branches/${branchId}/status`,
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
    ORDER_SUMMARY: '/owner/retail-orders/summary',
  },

  // 9. Kèo giao lưu cộng đồng người chơi (Matches)
  MATCHES: {
    LIST: '/matches',
    MY_JOINED: '/matches/my-joined',
    DETAIL: (id: string) => `/matches/${id}`,
    CREATE: '/matches',
    UPDATE: (id: string) => `/matches/${id}`,
    JOIN: (id: string) => `/matches/${id}/join`,
    APPROVE_PARTICIPANT: (matchId: string, participantId: string) =>
      `/matches/${matchId}/participants/${participantId}/approve`,
    REJECT_PARTICIPANT: (matchId: string, participantId: string) =>
      `/matches/${matchId}/participants/${participantId}/reject`,
    LEAVE: (id: string) => `/matches/${id}/leave`,
    CANCEL: (id: string) => `/matches/${id}/cancel`,
    DELETE: (id: string) => `/matches/${id}`,
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
    COURT_OWNER_REVENUE: '/owner/analytics/revenue',
    OWNER_REVENUE: '/owner/analytics/revenue',
    OWNER_OCCUPANCY_RATE: '/owner/analytics/occupancy',
  },

  // 14. File Upload (Storage)
  STORAGE: {
    UPLOAD: '/storage/upload',
  },
} as const;
