# Hệ Thống Đặt Lịch Thể Thao

Ứng dụng web đặt lịch thể thao được xây dựng với Node.js (Express) và React. Hỗ trợ đặt lịch cho nhiều môn thể thao như bóng đá, cầu lông, tennis, v.v.

## Tính Năng

- ✅ Xem danh sách các môn thể thao có sẵn
- ✅ Đặt lịch theo môn thể thao, sân, ngày và giờ
- ✅ Xem danh sách lịch đã đặt
- ✅ Lọc lịch đặt theo ngày
- ✅ Tính toán giá tự động dựa trên thời gian
- ✅ Kiểm tra xung đột lịch đặt
- ✅ Giao diện đẹp, responsive

## Công Nghệ Sử Dụng

### Backend
- Node.js
- Express.js
- MongoDB với Mongoose
- Express Validator

### Frontend
- React 18
- React Router
- Axios
- Date-fns
- CSS3 với gradient và animations

## Cài Đặt

### Yêu Cầu
- Node.js (v14 trở lên)
- MongoDB (cài đặt local hoặc sử dụng MongoDB Atlas)
- npm hoặc yarn

### Bước 1: Cài đặt dependencies

```bash
# Cài đặt tất cả dependencies cho cả backend và frontend
npm run install-all
```

Hoặc cài đặt riêng:

```bash
# Cài đặt root dependencies
npm install

# Cài đặt backend dependencies
cd server
npm install

# Cài đặt frontend dependencies
cd ../client
npm install
```

### Bước 2: Cấu hình MongoDB

Tạo file `.env` trong thư mục `server/`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sports-booking
```

Hoặc sử dụng MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sports-booking
```

### Bước 3: Khởi tạo dữ liệu mẫu (tùy chọn)

Chạy script để thêm dữ liệu mẫu:

```bash
cd server
node seed.js
```

### Bước 4: Chạy ứng dụng

**Cách 1: Chạy đồng thời backend và frontend**

```bash
npm run dev
```

**Cách 2: Chạy riêng biệt**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm start
```

Ứng dụng sẽ chạy tại:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Cấu Trúc Dự Án

```
.
├── server/                 # Backend Node.js/Express
│   ├── models/            # MongoDB models
│   │   ├── Sport.js
│   │   └── Booking.js
│   ├── routes/            # API routes
│   │   ├── sports.js
│   │   └── bookings.js
│   ├── index.js           # Server entry point
│   └── package.json
│
├── client/                # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   └── Navbar.js
│   │   ├── pages/        # Page components
│   │   │   ├── Home.js
│   │   │   ├── Booking.js
│   │   │   └── BookingsList.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── package.json          # Root package.json
```

## API Endpoints

### Sports
- `GET /api/sports` - Lấy danh sách tất cả môn thể thao
- `GET /api/sports/:id` - Lấy thông tin một môn thể thao
- `POST /api/sports` - Tạo môn thể thao mới (admin)
- `PUT /api/sports/:id` - Cập nhật môn thể thao
- `DELETE /api/sports/:id` - Xóa môn thể thao

### Bookings
- `GET /api/bookings` - Lấy danh sách tất cả lịch đặt
- `GET /api/bookings/date/:date` - Lấy lịch đặt theo ngày
- `GET /api/bookings/:id` - Lấy thông tin một lịch đặt
- `POST /api/bookings` - Tạo lịch đặt mới
- `PUT /api/bookings/:id/status` - Cập nhật trạng thái lịch đặt
- `DELETE /api/bookings/:id` - Xóa lịch đặt

## Sử Dụng

1. **Xem môn thể thao**: Truy cập trang chủ để xem danh sách các môn thể thao có sẵn
2. **Đặt lịch**: Click "Đặt Lịch Ngay" trên card môn thể thao hoặc vào trang đặt lịch
3. **Điền thông tin**: Điền đầy đủ thông tin khách hàng, chọn ngày giờ
4. **Xác nhận**: Hệ thống sẽ tự động tính giá và kiểm tra xung đột
5. **Xem lịch đã đặt**: Vào trang "Lịch Đã Đặt" để xem và quản lý

## Phát Triển Thêm

Một số tính năng có thể thêm vào:
- Xác thực người dùng (đăng nhập/đăng ký)
- Thanh toán online
- Gửi email xác nhận
- Quản lý admin panel
- Đánh giá và bình luận
- Thống kê và báo cáo

## License

MIT

## Tác Giả

Được tạo cho dự án KLTN 2026
