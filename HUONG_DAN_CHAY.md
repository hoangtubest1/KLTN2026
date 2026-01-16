# HƯỚNG DẪN CHẠY ỨNG DỤNG

## Bước 1: Cài đặt Dependencies (nếu chưa cài)

```bash
# Cài đặt root dependencies
npm install

# Cài đặt server dependencies
cd server
npm install

# Cài đặt client dependencies
cd ../client
npm install
```

## Bước 2: Cấu hình MongoDB

Đảm bảo file `server/.env` đã được tạo với nội dung:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sports-booking
```

Hoặc nếu dùng MongoDB Atlas:
```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sports-booking
```

## Bước 3: Khởi tạo dữ liệu mẫu (Tùy chọn)

```bash
cd server
node seed.js
```

## Bước 4: Chạy ứng dụng

### Cách 1: Chạy đồng thời cả Backend và Frontend (Khuyến nghị)

Từ thư mục gốc:
```bash
npm run dev
```

### Cách 2: Chạy riêng biệt

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

## Truy cập ứng dụng

- **Frontend (React)**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Kiểm tra

1. Mở trình duyệt và vào http://localhost:3000
2. Bạn sẽ thấy trang chủ với danh sách môn thể thao
3. Click "Đặt Lịch Ngay" để đặt lịch
4. Xem "Lịch Đã Đặt" để quản lý bookings

## Lưu ý

- Đảm bảo MongoDB đang chạy (local hoặc Atlas)
- Nếu có lỗi kết nối MongoDB, kiểm tra lại file `.env`
- Port 3000 và 5000 phải trống

