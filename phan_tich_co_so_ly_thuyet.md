# Phân tích Chương II: CƠ SỞ LÝ THUYẾT (KLTN_2026.docx)

## Tổng quan cấu trúc

Chương II gồm **5 mục** chính:

| Mục | Nội dung | Đánh giá |
|-----|----------|----------|
| 2.1 | React | ✅ Tốt |
| 2.2 | Spring Boot (**lỗi chính tả**) | ⚠️ Cần sửa |
| 2.3 | MySQL | ✅ Khá tốt |
| 2.4 | Bootstrap CSS | ❓ Cần xem xét |
| 2.5 | GitHub | ❓ Cần xem xét |

---

## Chi tiết đánh giá từng mục

### 2.1 React
- **Nội dung**: Giới thiệu React là thư viện JavaScript xây dựng UI, component-based architecture, JSX, Virtual DOM, props/state, Hooks (useState, useEffect).
- **Ưu điểm nêu ra**: Kiến trúc component-based, hỗ trợ Hooks.
- **Minh họa ứng dụng**: Có hình ảnh minh họa tạo component và tái sử dụng.
- **Tài liệu tham khảo**: [1]
- **Nhận xét**: Phần này khá đầy đủ và rõ ràng. Mô tả các khái niệm cốt lõi của React một cách hệ thống.

### 2.2 Spring Boot

> [!WARNING]
> **Lỗi chính tả nghiêm trọng**: Tiêu đề ghi là "Spring boots" (viết thường, có chữ "s" thừa). Tên chính xác phải là "**Spring Boot**" (viết hoa, không có "s").

> [!IMPORTANT]  
> **Mâu thuẫn với thực tế dự án**: Phần lý thuyết mô tả Spring Boot (Java framework), nhưng **dự án thực tế sử dụng Node.js + Express.js** cho phần backend (dựa trên cấu trúc thư mục `server/` với các file `index.js`, `routes/chatbot.js`, v.v.). Đây là **mâu thuẫn quan trọng nhất** cần được giải quyết.

- **Nội dung**: Giới thiệu Spring Boot là framework backend dựa trên Spring Framework, dependency injection, Convention over Configuration, Layered Architecture (Controller, Service Layer, Repository/Data Access Layer, Entity/Domain Model).
- **Ưu điểm nêu ra**: Auto-Configuration, Starter Dependencies, phát triển nhanh RESTful API.
- **Minh họa ứng dụng**: Có hình ảnh minh họa chạy server, JPA dependency, tạo endpoint với `@RestController` + `@GetMapping`, CRUD Repository.
- **Tài liệu tham khảo**: [2]

> [!CAUTION]
> Cần xác minh xem Spring Boot có thực sự được sử dụng trong dự án hay không. Từ các cuộc hội thoại trước, backend được xây dựng bằng **Node.js/Express.js** (file `server/index.js`, `server/routes/chatbot.js`), **KHÔNG phải Spring Boot**. Nếu Spring Boot không được sử dụng, phần này cần được **thay thế hoàn toàn** bằng nội dung về Node.js/Express.js.

### 2.3 MySQL
- **Nội dung**: Giới thiệu MySQL là RDBMS mã nguồn mở, SQL (CRUD operations), tính năng transaction support, MVCC, foreign keys.
- **Ưu điểm nêu ra**: Bảo mật dữ liệu mạnh mẽ (xác thực, mã hóa), quản lý truy vấn phức tạp (JOIN, GROUP BY, HAVING).
- **Minh họa ứng dụng**: Có hình ảnh minh họa bảo mật xác thực người dùng và sử dụng truy vấn SQL kết hợp với Node.js.
- **Tài liệu tham khảo**: [3]

> [!NOTE]
> Phần minh họa đề cập đến **Node.js** kết hợp với MySQL, điều này phù hợp với thực tế dự án (backend dùng Node.js). Tuy nhiên, điều này lại mâu thuẫn với mục 2.2 khi nói về Spring Boot. Cần nhất quán hóa.

### 2.4 Bootstrap CSS
- **Cần xem xét**: Phần này cung cấp thông tin về Bootstrap CSS framework. Tuy nhiên, cần xác minh xem dự án có thực sự sử dụng Bootstrap CSS hay không (client có thể sử dụng framework CSS khác hoặc không sử dụng Bootstrap).

### 2.5 GitHub
- **Cần xem xét**: Phần này mô tả GitHub cho quản lý phiên bản (version control). Đây là công cụ hỗ trợ phát triển, không phải công nghệ core của dự án.

---

## Các vấn đề cần khắc phục (ưu tiên cao → thấp)

### 1. 🔴 Mâu thuẫn nghiêm trọng: Spring Boot vs Node.js/Express.js
**Vấn đề**: Phần 2.2 viết về Spring Boot (Java), nhưng backend thực tế sử dụng Node.js/Express.js.

**Bằng chứng**:
- Thư mục `server/` chứa các file `.js` (JavaScript), không phải Java
- File `server/index.js` là entry point của ứng dụng Express.js
- File `server/routes/chatbot.js` xử lý các route chatbot
- File `.env` cấu hình cho môi trường Node.js
- Phần 2.3 (MySQL) lại minh họa kết hợp với Node.js

**Giải pháp đề xuất**: 
- Nếu dự án **KHÔNG** sử dụng Spring Boot → Thay thế hoàn toàn mục 2.2 bằng nội dung về **Node.js** và **Express.js**
- Nếu dự án có kế hoạch chuyển sang Spring Boot → Ghi rõ kế hoạch và lý do

### 2. 🟡 Lỗi chính tả: "Spring boots" → "Spring Boot"
Dù giữ lại hay thay thế mục 2.2, cần sửa tên gọi cho chính xác.

### 3. 🟡 Thiếu công nghệ AI
Dự án được mô tả là "tích hợp AI" (từ các cuộc hội thoại trước về Vertex AI, Gemini API), nhưng phần Cơ sở lý thuyết **không có mục nào** đề cập đến:
- Google Gemini API / Vertex AI
- Large Language Models (LLM)
- Kỹ thuật prompt engineering
- AI Chatbot architecture

**Giải pháp đề xuất**: Bổ sung một mục mới (ví dụ: 2.6 Trí tuệ nhân tạo / AI) mô tả các công nghệ AI được sử dụng trong dự án.

### 4. 🟢 Thiếu Express.js
Express.js là framework backend cốt lõi của dự án nhưng không được đề cập trong phần Cơ sở lý thuyết.

### 5. 🟢 Xem xét lại Bootstrap CSS và GitHub
- Cần xác minh Bootstrap CSS có được sử dụng trong client hay không
- GitHub là công cụ DevOps, có thể không cần thiết trong phần lý thuyết công nghệ

---

## Đề xuất cấu trúc mới cho Chương II

Nếu dự án thực sự sử dụng Node.js/Express.js (không phải Spring Boot), cấu trúc đề xuất:

| Mục | Nội dung |
|-----|----------|
| 2.1 | React (giữ nguyên, chỉnh sửa nhẹ) |
| 2.2 | **Node.js & Express.js** (thay thế Spring Boot) |
| 2.3 | MySQL (giữ nguyên, đảm bảo nhất quán) |
| 2.4 | Bootstrap CSS (giữ nếu thực sự sử dụng) |
| 2.5 | **Google Gemini API / Vertex AI** (bổ sung mới) |
| 2.6 | GitHub (giữ nguyên) |
