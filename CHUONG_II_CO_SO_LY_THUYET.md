# CHƯƠNG II: CƠ SỞ LÝ THUYẾT

## 2.1 React

### 2.1.1 Giới thiệu
React là thư viện JavaScript mã nguồn mở do Meta phát triển, được sử dụng rộng rãi để xây dựng giao diện người dùng (UI) cho ứng dụng web. React tập trung vào tầng View, cho phép lập trình viên tự do chọn thư viện bổ sung cho routing, quản lý trạng thái và giao tiếp API.

### 2.1.2 Kiến trúc Component-Based
React áp dụng kiến trúc dựa trên component, trong đó giao diện được chia thành các thành phần độc lập và tái sử dụng. Trong dự án Timsan247, ứng dụng được tổ chức:

```
client/src/
├── App.js              // Component gốc
├── components/         // Component tái sử dụng (Navbar, ChatBot, ProtectedRoute...)
├── pages/              // Các trang (Home, Booking, FieldsList...)
├── context/            // React Context (AuthContext, SocketContext, NotificationContext)
└── hooks/              // Custom Hooks
```

### 2.1.3 JSX và Hooks
JSX cho phép viết cấu trúc HTML trong JavaScript. React Hooks (useState, useEffect, useContext) cho phép quản lý state và side effects trong functional component.

**Ví dụ từ dự án** (`App.js`):
```jsx
function AppContent() {
  return (
    <div className="App">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fields" element={<FieldsList />} />
          <Route path="/booking/:sportId?" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
      <ChatBot />
    </div>
  );
}
```

### 2.1.4 React Router
Dự án sử dụng React Router v6 để xây dựng SPA với định tuyến động (`/facility/:id`), route bảo vệ (`ProtectedRoute`, `AdminRoute`) để kiểm soát quyền truy cập.

---

## 2.2 Node.js và Express.js

### 2.2.1 Node.js
Node.js là môi trường runtime JavaScript mã nguồn mở, xây dựng trên engine V8 của Google Chrome. Đặc điểm: kiến trúc Event-Driven, non-blocking I/O, đơn luồng nhưng hiệu suất cao, hệ sinh thái NPM với hơn 2 triệu package.

### 2.2.2 Express.js
Express.js là framework web tối giản cho Node.js, cung cấp middleware pipeline, routing mạnh mẽ và hỗ trợ xây dựng RESTful API.

**Ví dụ từ dự án** (`server/index.js`):
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// RESTful API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sports', require('./routes/sports'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/notifications', require('./routes/notifications'));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 2.2.3 Kiến trúc phân tầng
```
server/
├── index.js        // Entry point, cấu hình Express & Socket.IO
├── config/         // Cấu hình database
├── models/         // Sequelize models (tầng Data Access)
├── routes/         // Route handlers (tầng Controller)
├── middleware/     // Xác thực JWT, validation
└── utils/          // Hàm tiện ích
```

---

## 2.3 MySQL và Sequelize ORM

### 2.3.1 MySQL
MySQL là RDBMS mã nguồn mở phổ biến nhất, hỗ trợ ACID transaction, foreign key, JOIN và các ràng buộc toàn vẹn tham chiếu.

### 2.3.2 Sequelize ORM
Sequelize là ORM cho Node.js, cho phép tương tác database qua đối tượng JavaScript.

**Ví dụ Model** (`server/models/Facility.js`):
```javascript
const Facility = sequelize.define('Facility', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    sportId: {
        type: DataTypes.INTEGER,
        references: { model: 'sports', key: 'id' },
        onDelete: 'CASCADE'
    },
    address: { type: DataTypes.STRING(255), allowNull: false },
    pricePerHour: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
}, { tableName: 'facilities', timestamps: true });
```

**Quan hệ dữ liệu** (`server/models/index.js`):
```javascript
// Sport ↔ Facility (One-to-Many)
Sport.hasMany(Facility, { foreignKey: 'sportId', as: 'facilities' });
Facility.belongsTo(Sport, { foreignKey: 'sportId', as: 'sport' });

// User ↔ Review (One-to-Many)
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
```

---

## 2.4 Tailwind CSS

### 2.4.1 Giới thiệu
Tailwind CSS là framework CSS theo hướng utility-first, cung cấp các lớp tiện ích cấp thấp để xây dựng giao diện tùy chỉnh trực tiếp trong JSX.

### 2.4.2 Đặc điểm
- **Utility-First**: Mỗi class thực hiện một nhiệm vụ (`text-center`, `bg-blue-500`, `rounded-2xl`)
- **Responsive Design**: Prefix breakpoint (`sm:`, `md:`, `lg:`, `xl:`)
- **Tree-shaking**: Tự động loại bỏ class không sử dụng trong production
- **Tùy biến**: Cấu hình qua `tailwind.config.js`

**Ví dụ từ dự án**:
```jsx
<div className="bg-white rounded-2xl shadow-2xl border border-gray-100
                p-4 flex items-start gap-3 cursor-pointer
                hover:shadow-xl transition-shadow">
  <p className="text-sm font-bold text-gray-900">{toast.title}</p>
  <p className="text-xs text-gray-500 mt-0.5">{toast.message}</p>
</div>
```

---

## 2.5 Google Vertex AI và Gemini API

### 2.5.1 Giới thiệu
Google Vertex AI là nền tảng ML của Google Cloud, tích hợp các mô hình AI/ML quy mô lớn. Gemini là dòng mô hình ngôn ngữ lớn đa phương thức (multimodal LLM) của Google. Dự án sử dụng **Gemini 2.5 Flash** - tối ưu cho chatbot với tốc độ nhanh và chi phí thấp.

### 2.5.2 Các tính năng sử dụng
- **System Instruction**: Cấu hình vai trò và quy tắc cho AI
- **Google Search Grounding**: AI truy cập thông tin thời gian thực từ Google Search
- **Application Default Credentials (ADC)**: Xác thực an toàn với Google Cloud

### 2.5.3 Kiến trúc chatbot 3 tầng
1. **Phân loại câu hỏi**: Trong phạm vi (đặt sân) hay ngoài phạm vi (kiến thức chung)
2. **Gọi Gemini + dữ liệu database**: Truy xuất dữ liệu thực (sân, giá, lịch đặt) gửi kèm cho Gemini
3. **Fallback rule-based**: Khi API không khả dụng

**Ví dụ** (`server/routes/chatbot.js`):
```javascript
const { GoogleAuth } = require('google-auth-library');

async function callGeminiAPI(systemInstruction, prompt, history, options) {
    const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
    const client = await auth.getClient();
    const { token: accessToken } = await client.getAccessToken();

    const model = 'gemini-2.5-flash';
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${model}:generateContent`;

    const requestBody = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.6 }
    };

    if (options.useSearch) {
        requestBody.tools = [{ googleSearch: {} }];
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(requestBody)
    });
    return response.json();
}
```

---

## 2.6 Socket.IO

### 2.6.1 Giới thiệu
Socket.IO là thư viện cho phép giao tiếp hai chiều theo thời gian thực giữa server và client. Được xây dựng trên WebSocket với tự động reconnect và fallback sang long-polling.

### 2.6.2 Ứng dụng trong dự án
- **Cập nhật trạng thái sân**: Realtime khi có đặt sân mới
- **Group Chat**: Tin nhắn nhóm tìm đối realtime
- **Thông báo**: Push notification trực tiếp đến người dùng

**Ví dụ** (`server/index.js`):
```javascript
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: allowedOrigins } });

io.on('connection', (socket) => {
  socket.on('join-facility', ({ facilityId, date }) => {
    socket.join(`facility:${facilityId}:${date}`);
  });
  socket.on('join-group', ({ groupId }) => {
    socket.join(`group:${groupId}`);
  });
  socket.on('join-user', ({ userId }) => {
    socket.join(`user:${userId}`);
  });
});
```

---

## 2.7 GitHub

### 2.7.1 Giới thiệu
GitHub là nền tảng lưu trữ mã nguồn dựa trên Git - hệ thống quản lý phiên bản phân tán. GitHub cung cấp công cụ cộng tác, theo dõi lỗi và tích hợp liên tục.

### 2.7.2 Sử dụng trong dự án
Dự án Timsan247 quản lý toàn bộ mã nguồn (client + server) trong cùng một repository, sử dụng branch/merge cho phát triển tính năng và `.gitignore` để loại trừ `node_modules/` và `.env`.
