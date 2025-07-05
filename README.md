# UIT-W2F: Hệ Thống Tìm Kiếm Đồ Thất Lạc tại UIT

## Giới thiệu

**UIT-W2F** là hệ thống quản lý và tìm kiếm đồ thất lạc dành cho sinh viên tại Trường Đại học Công nghệ Thông tin (ĐHQG-HCM). Hệ thống giải quyết các hạn chế của phương pháp quản lý truyền thống (qua phòng CTSV, Lost & Found, mạng xã hội rời rạc) bằng cách cung cấp nền tảng tập trung, hiện đại, hỗ trợ tìm kiếm, trao đổi và xác thực thông tin đồ thất lạc một cách nhanh chóng, minh bạch và bảo mật.

---

## Thành viên thực hiện

- **Lê Bảo Long** - 23520877
- **Nguyễn Thuận Phát** - 23521146
- **Phan Xuân Thành** - 23521461

Giảng viên hướng dẫn: Th.S Đỗ Văn Tiến

---

## Tính năng chính

- **Đăng ký/Đăng nhập** bằng email, số điện thoại, mã sinh viên; xác thực email.
- **Quản lý thông tin cá nhân**: cập nhật, đổi mật khẩu, xem lịch sử hoạt động.
- **Đăng tin mất đồ/nhặt được đồ**: nhập thông tin, hình ảnh, phân loại theo trạng thái.
- **Tìm kiếm & lọc thông tin**: theo từ khóa, loại đồ, vị trí, thời gian, trạng thái.
- **Nhắn tin trực tiếp** giữa người mất và người nhặt (chat realtime).
- **Quản trị & kiểm duyệt**: duyệt bài, xử lý báo cáo, quản lý người dùng.
- **Thông báo tự động**: khi có bài đăng trùng khớp, tin nhắn mới, thay đổi trạng thái.
- **Cập nhật trạng thái bài đăng** (đã tìm thấy, đã trả lại, v.v.).
- **Báo cáo vi phạm**: gửi, xử lý, thống kê báo cáo nội dung không phù hợp.

---

## Kiến trúc hệ thống

| Thành phần             | Công nghệ chính   | Vai trò chính                                                                                 |
|------------------------|-------------------|----------------------------------------------------------------------------------------------|
| Presentation Layer     | React, Chakra UI  | Giao diện người dùng, định tuyến, xác thực, realtime chat, thông báo, upload ảnh             |
| Application Layer      | FastAPI (Python)  | API server, xử lý nghiệp vụ, xác thực, phân quyền, WebSocket, gửi mail, background tasks     |
| Data Layer             | MongoDB, PyMongo  | Lưu trữ người dùng, bài đăng, tin nhắn, thông báo, file upload                              |

- **Frontend** giao tiếp với backend qua REST API và WebSocket.
- **Backend** xác thực, xử lý logic, gửi/nhận dữ liệu từ database.
- **Database** lưu trữ toàn bộ thông tin, hỗ trợ truy vấn và mở rộng.

---

## 🏗️ Kiến trúc hệ thống

```
📁 Project Structure
├── 📁 backend/               # FastAPI Backend
│   ├── 📁 services/         # Business logic layer
│   ├── 📁 uploads/          # File storage
│   ├── main.py              # API endpoints
│   ├── models.py            # Pydantic models
│   ├── db.py                # Database connection
│   ├── config.py            # Configuration
│   └── requirements.txt     # Python dependencies
├── 📁 frontend/             # ReactJS Frontend  
│   ├── 📁 src/
│   │   ├── 📁 components/   # Reusable components
│   │   ├── 📁 pages/        # Route pages
│   │   ├── 📁 hooks/        # Custom React hooks
│   │   ├── 📁 utils/        # Utility functions
│   │   └── 📁 assets/       # Static resources
│   └── package.json         # NPM dependencies
└── 📁 use_case_diagrams/    # System documentation
```

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Python 3.10+
- Node.js 18+
- MongoDB 5.0+
- npm/yarn

### 1. Setup Backend

```bash
cd backend/

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc venv\Scripts\activate  # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env
cp .env.example .env  # Cấu hình theo môi trường

# Chạy server
python main.py
```

### 2. Setup Frontend

```bash
cd frontend/

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

### 3. Setup Database

```bash
# Khởi động MongoDB
mongod

# Import sample data (optional)
mongoimport --db uit_lost_found --collection posts --file sample_data.json
```

### 4. Truy cập ứng dụng

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📁 Cấu trúc file chi tiết

### Backend Structure

```
backend/
├── config.py              # Cấu hình tập trung
├── main.py                 # FastAPI app và routes
├── models.py               # Pydantic models
├── db.py                   # MongoDB connection
├── hashing.py              # Password hashing
├── oauth.py                # JWT authentication
├── services/
│   ├── post_service.py     # Business logic cho posts
│   └── message_service.py  # Business logic cho messages
├── uploads/                # File storage directory
```

### Frontend Structure

```
frontend/src/
├── components/
│   ├── AuthContext.jsx        # Authentication provider
│   ├── SocketContext.jsx      # WebSocket provider
│   ├── Navigation.jsx         # Main navigation
│   ├── ProtectedRoute.jsx     # Route protection
│   ├── NotificationCenter.jsx # Notification system
│   └── ui/                    # UI components
├── pages/
│   ├── LoginPage.jsx          # User login
│   ├── RegisterPage.jsx       # User registration
│   ├── Homepage.jsx           # Main dashboard
│   ├── ChatPage.jsx           # Messaging interface
│   ├── Dangtin.jsx            # Post creation
│   ├── PostDetailPage.jsx     # Post details
│   ├── ProfilePage.jsx        # User profile
│   └── Admin*.jsx             # Admin pages
├── hooks/
│   └── useChat.js             # Chat functionality hook
├── utils/
│   └── constants.js           # App constants
└── assets/                    # Static resources
```

## 🔑 Tính năng chi tiết

### 1. Hệ thống xác thực
- Đăng ký với email UIT (@gm.uit.edu.vn)
- Xác thực email tự động
- JWT token với refresh mechanism
- Bảo mật session và CORS

### 2. Quản lý bài đăng
- **Tạo bài đăng**: Upload ảnh, mô tả chi tiết
- **Phân loại**: "Tìm đồ" / "Nhặt được"
- **Trạng thái**: Tự động set "Chưa tìm được"/"Chưa hoàn trả"
- **Tìm kiếm**: Filter theo category, location, keywords
- **View tracking**: Đếm lượt xem bài đăng

### 3. Chat realtime
- **1-1 messaging**: Chat trực tiếp giữa users
- **Typing indicators**: Hiển thị đang nhập
- **Message status**: Đã gửi/đã đọc indicators
- **Message actions**: Thu hồi, chỉnh sửa (15 phút)
- **Auto-draft**: Tin nhắn soạn sẵn từ "Liên hệ ngay"

### 4. Thông báo
- **Realtime notifications**: WebSocket push
- **Email notifications**: Background task processing
- **Badge counts**: Unread message/notification counts
- **Action notifications**: Comment, message, status updates

### 5. Admin panel
- **User management**: Ban/mute users
- **Content moderation**: Review posts/comments
- **Analytics dashboard**: System statistics
- **Report handling**: Process user reports

## 🔧 Configuration

### Environment Variables

```bash
# Backend (.env)
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=525600
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=uit_lost_found
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend (.env.local)
VITE_API_BASE_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

### Database Collections

```javascript
// MongoDB Collections
users: {
  username, email, password_hash, full_name, 
  student_id, avatar_url, is_active, created_at
}

posts: {
  title, content, category, item_type, tags,
  location, image_urls, status, author,
  view_count, created_at, updated_at
}

direct_messages: {
  from_user, to_user, content, timestamp,
  is_read, is_delivered, post_id, reply_to
}

conversations: {
  participants[], last_message_id,
  created_at, updated_at
}

notifications: {
  user_id, type, title, message, is_read,
  related_post_id, created_at
}
```


## 📊 API Documentation


| Endpoint | Method | Description |
|----------|--------|-------------|
| `/posts` | GET, POST | Quản lý bài đăng |
| `/posts/{id}` | GET, PUT, DELETE | Chi tiết bài đăng |
| `/conversations` | GET | Danh sách cuộc trò chuyện |
| `/conversations/{user}/messages` | GET, POST | Tin nhắn |
| `/auth/login` | POST | Đăng nhập |
| `/auth/register` | POST | Đăng ký |
| `/notifications` | GET | Thông báo |
| `/admin/*` | * | Admin endpoints |

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.
