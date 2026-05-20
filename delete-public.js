const fs = require('fs');
const path = require('path');

const dirToDelete = path.join(__dirname, 'public');

console.log(`Bắt đầu xóa thư mục: ${dirToDelete}`);

try {
    // Xóa thư mục và toàn bộ nội dung bên trong (yêu cầu Node.js v14.14.0+)
    fs.rmSync(dirToDelete, { recursive: true, force: true });
    console.log('✅ Đã xóa thành công thư mục public và tất cả nội dung bên trong!');
} catch (err) {
    console.error('❌ Lỗi khi xóa:', err.message);
    
    // Fallback cho Node.js bản cũ hơn
    try {
        fs.rmdirSync(dirToDelete, { recursive: true });
        console.log('✅ Đã xóa thành công bằng rmdirSync!');
    } catch (e2) {
        console.error('❌ Lỗi fallback:', e2.message);
    }
}

console.log('Bây giờ bạn có thể giải nén file zip mới!');
process.exit(0);
