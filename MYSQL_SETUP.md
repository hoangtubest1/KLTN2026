# Hướng Dẫn Cài Đặt và Sử Dụng MySQL

## Bước 1: Cài Đặt MySQL

### Option 1: MySQL Community Server (Khuyến nghị)

1. **Download MySQL:**
   - Truy cập: https://dev.mysql.com/downloads/mysql/
   - Chọn phiên bản phù hợp với Windows
   - Download MySQL Installer

2. **Cài đặt:**
   - Chạy file installer
   - Chọn "Developer Default" hoặc "Server only"
   - Thiết lập root password (nhớ password này!)
   - Port mặc định: 3306
   - Hoàn tất cài đặt

3. **Kiểm tra cài đặt:**
   ```bash
   mysql --version
   ```

### Option 2: XAMPP (Dễ hơn cho người mới)

1. **Download XAMPP:**
   - Truy cập: https://www.apachefriends.org/
   - Download phiên bản Windows

2. **Cài đặt:**
   - Chạy installer
   - Chọn MySQL component
   - Cài đặt vào thư mục mặc định

3. **Khởi động MySQL:**
   - Mở XAMPP Control Panel
   - Click "Start" ở MySQL
   - MySQL sẽ chạy trên port 3306

### Option 3: MySQL Cloud (PlanetScale - Free)

1. Truy cập: https://planetscale.com/
2. Đăng ký tài khoản miễn phí
3. Tạo database mới
4. Copy connection string
5. Cập nhật vào `.env`

---

## Bước 2: Tạo Database

### Sử dụng MySQL Command Line:

```bash
# Đăng nhập MySQL
mysql -u root -p

# Nhập password bạn đã thiết lập

# Tạo database
CREATE DATABASE sports_booking;

# Kiểm tra database đã tạo
SHOW DATABASES;

# Thoát
exit;
```

### Sử dụng MySQL Workbench (GUI):

1. Mở MySQL Workbench
2. Connect to MySQL server
3. Click "Create Schema" icon
4. Nhập tên: `sports_booking`
5. Click "Apply"

### Sử dụng phpMyAdmin (nếu dùng XAMPP):

1. Mở trình duyệt: http://localhost/phpmyadmin
2. Click tab "Databases"
3. Nhập tên database: `sports_booking`
4. Click "Create"

---

## Bước 3: Cấu Hình .env

Mở file `server/.env` và cập nhật:

```env
# MySQL Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sports_booking
DB_USER=root
DB_PASSWORD=root

# Nếu dùng XAMPP, password thường để trống:
# DB_PASSWORD=

# Nếu dùng PlanetScale hoặc cloud:
# DB_HOST=your-host.planetscale.com
# DB_USER=your-username
# DB_PASSWORD=your-password
```

---

## Bước 4: Chạy Migration và Seed

### 1. Sync Database (Tạo Tables):

```bash
cd server
node scripts/sync-database.js
```

Hoặc với options:
```bash
# Tạo tables nếu chưa có
node scripts/sync-database.js

# Modify tables để match models
node scripts/sync-database.js --alter

# DROP và tạo lại tất cả (XÓA DATA!)
node scripts/sync-database.js --force
```

### 2. Seed Sample Data:

```bash
node seed.js
```

Lệnh này sẽ tạo:
- 6 môn thể thao (Bóng đá, Pickleball, Cầu lông, Tennis, Bóng rổ, Bóng chuyền)
- Nhiều facilities cho mỗi môn
- 2 users:
  - Admin: `admin@sports.com` / `admin123`
  - User: `user@sports.com` / `user123`

---

## Bước 5: Chạy Server

```bash
# Trong thư mục server
npm run dev

# Hoặc từ root
cd ..
npm run dev
```

Bạn sẽ thấy:
```
✅ MySQL connection established successfully
✅ Database synchronized successfully
🚀 Server is running on port 5000
```

---

## Kiểm Tra Database

### Sử dụng MySQL Command Line:

```bash
mysql -u root -p

USE sports_booking;

# Xem tất cả tables
SHOW TABLES;

# Xem dữ liệu trong table
SELECT * FROM sports;
SELECT * FROM facilities;
SELECT * FROM users;
SELECT * FROM bookings;

# Xem structure của table
DESCRIBE sports;
```

### Sử dụng MySQL Workbench:

1. Connect to server
2. Chọn schema `sports_booking`
3. Expand "Tables"
4. Right-click table → "Select Rows"

---

## Troubleshooting

### Lỗi: "Access denied for user 'root'@'localhost'"

**Nguyên nhân:** Password sai hoặc user không tồn tại

**Giải pháp:**
```bash
# Reset root password
mysql -u root

# Trong MySQL:
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Lỗi: "Can't connect to MySQL server"

**Nguyên nhân:** MySQL service chưa chạy

**Giải pháp:**
- Windows: Mở Services → Tìm "MySQL" → Start
- XAMPP: Mở Control Panel → Start MySQL

### Lỗi: "Database 'sports_booking' doesn't exist"

**Giải pháp:**
```bash
mysql -u root -p
CREATE DATABASE sports_booking;
```

### Lỗi: "ER_NOT_SUPPORTED_AUTH_MODE"

**Nguyên nhân:** MySQL 8.0 dùng caching_sha2_password

**Giải pháp:**
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

---

## So Sánh MongoDB vs MySQL

| Feature | MongoDB | MySQL |
|---------|---------|-------|
| Type | NoSQL (Document) | SQL (Relational) |
| Schema | Flexible | Fixed |
| Queries | `find()`, `findOne()` | `findAll()`, `findByPk()` |
| ID | ObjectId (string) | Integer (auto-increment) |
| Relationships | Embedded or Referenced | Foreign Keys |
| Transactions | Limited | Full ACID |

---

## Các Lệnh MySQL Hữu Ích

```sql
-- Xem tất cả databases
SHOW DATABASES;

-- Chọn database
USE sports_booking;

-- Xem tất cả tables
SHOW TABLES;

-- Xem structure của table
DESCRIBE table_name;

-- Xem dữ liệu
SELECT * FROM table_name;

-- Đếm số records
SELECT COUNT(*) FROM table_name;

-- Xóa tất cả data (giữ structure)
TRUNCATE TABLE table_name;

-- Xóa table
DROP TABLE table_name;

-- Xóa database
DROP DATABASE sports_booking;

-- Backup database
mysqldump -u root -p sports_booking > backup.sql

-- Restore database
mysql -u root -p sports_booking < backup.sql
```

---

## Next Steps

1. ✅ MySQL đã cài đặt
2. ✅ Database đã tạo
3. ✅ Tables đã sync
4. ✅ Sample data đã seed
5. 🚀 Server đang chạy

**Bây giờ bạn có thể:**
- Test API endpoints với Postman
- Chạy React frontend
- Tạo bookings mới
- Quản lý users và facilities

**Tài liệu tham khảo:**
- Sequelize Docs: https://sequelize.org/docs/v6/
- MySQL Docs: https://dev.mysql.com/doc/
