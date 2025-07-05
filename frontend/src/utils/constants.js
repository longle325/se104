// API Configuration
export const API_BASE_URL = 'http://localhost:8000';

// Post Status Configuration
export const POST_STATUS = {
  LOST: {
    NOT_FOUND: { value: 'not_found', label: 'Chưa tìm được', color: 'orange' },
    FOUND: { value: 'found', label: 'Đã tìm được', color: 'green' }
  },
  FOUND: {
    NOT_RETURNED: { value: 'not_returned', label: 'Chưa hoàn trả', color: 'orange' },
    RETURNED: { value: 'returned', label: 'Đã hoàn trả', color: 'green' }
  }
};

// Categories
export const CATEGORIES = {
  LOST: { value: 'lost', label: 'Tìm đồ', color: 'red' },
  FOUND: { value: 'found', label: 'Nhặt được', color: 'green' }
};

// Item Types
export const ITEM_TYPES = {
  STUDENT_CARD: { value: 'the_sinh_vien', label: 'Thẻ sinh viên' },
  WALLET_DOCUMENTS: { value: 'vi_giay_to', label: 'Ví/Giấy tờ' },
  ELECTRONICS: { value: 'dien_tu', label: 'Điện thoại/Tablet/Laptop' },
  OTHER: { value: 'khac', label: 'Đồ vật khác' }
};

// Locations
export const LOCATIONS = [
  { value: 'cong_truoc', label: 'Cổng trước' },
  { value: 'toa_a', label: 'Tòa A' },
  { value: 'toa_b', label: 'Tòa B' },
  { value: 'toa_c', label: 'Tòa C' },
  { value: 'toa_d', label: 'Tòa D' },
  { value: 'toa_e', label: 'Tòa E' },
  { value: 'canteen', label: 'Căng tin' },
  { value: 'cafe_voi', label: 'Cafe Vối' },
  { value: 'san_the_thao', label: 'Sân thể thao' },
  { value: 'bai_do_xe', label: 'Bãi đỗ xe' },
  { value: 'cong_sau', label: 'Cổng sau' },
  { value: 'khac', label: 'Khác' }
];

// Message Templates
export const MESSAGE_TEMPLATES = {
  CONTACT_POST: (title, postLink) => `Chào bạn! Tôi quan tâm đến bài đăng "${title}" của bạn.\n\n📝 Bài đăng: ${postLink}\n\nCó thể liên hệ để biết thêm chi tiết không?`,
  FOUND_ITEM: (title) => `Chào bạn, tôi nghĩ tôi có thể đã tìm thấy đồ vật mà bạn đang tìm kiếm trong bài đăng "${title}". Bạn có thể mô tả chi tiết hơn không?`,
  LOST_ITEM: (title) => `Chào bạn, tôi đã đánh mất đồ vật tương tự như trong bài đăng "${title}" của bạn. Bạn có thể cho tôi xem hình ảnh chi tiết hơn không?`
};

// Chat Constants
export const CHAT_CONFIG = {
  MESSAGE_LIMIT: 50,
  TYPING_TIMEOUT: 3000,
  RECONNECT_DELAY: 1000,
  MAX_RECONNECT_ATTEMPTS: 5,
  MESSAGE_EDIT_TIME_LIMIT: 15 * 60 * 1000, // 15 minutes
  MAX_MESSAGE_LENGTH: 2000
};

// File Upload Constants
export const UPLOAD_CONFIG = {
  MAX_FILES: 5,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

// Socket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  NEW_MESSAGE: 'new_message',
  MESSAGE_READ: 'message_read',
  MESSAGE_DELETED: 'message_deleted',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room'
};

// Routes
export const ROUTES = {
  HOME: '/homepage',
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/chat',
  POST_DETAIL: '/posts',
  PROFILE: '/profile',
  DANGTIN: '/dangtin'
}; 