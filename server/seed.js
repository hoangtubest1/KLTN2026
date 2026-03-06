const { sequelize, Sport, Facility, User } = require('./models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sportsData = [
  {
    name: 'football',
    nameVi: 'Bóng Đá',
    description: 'Sân bóng đá chất lượng cao, phù hợp cho các trận đấu và luyện tập',
    pricePerHour: 200000
  },
  {
    name: 'pickleball',
    nameVi: 'Pickleball',
    description: 'Sân Pickleball trong nhà, có điều hòa, ánh sáng tốt',
    pricePerHour: 100000
  },
  {
    name: 'badminton',
    nameVi: 'Cầu Lông',
    description: 'Sân cầu lông trong nhà, có điều hòa, ánh sáng tốt',
    pricePerHour: 100000
  },
  {
    name: 'tennis',
    nameVi: 'Tennis',
    description: 'Sân tennis ngoài trời, mặt sân đẹp.',
    pricePerHour: 300000
  },
  {
    name: 'basketball',
    nameVi: 'Bóng Rổ',
    description: 'Sân bóng rổ trong nhà, sàn gỗ, có điều hòa',
    pricePerHour: 250000
  },
  {
    name: 'volleyball',
    nameVi: 'Bóng Chuyền',
    description: 'Sân bóng chuyền trong nhà, lưới chuẩn, sàn chống trượt',
    pricePerHour: 150000
  }
];

const facilitiesData = {
  'football': [
    { name: 'Sân Thống Nhất', address: '123 Đường Nguyễn Huệ, Quận 1', phone: '0901234567', pricePerHour: 200000, description: 'Sân 11 người, cỏ nhân tạo cao cấp', courtCount: 3, latitude: 10.7769, longitude: 106.7009 },
    { name: 'Sân Phú Thọ', address: '456 Đường Lý Thường Kiệt, Quận 2', phone: '0901234568', pricePerHour: 200000, description: 'Sân 11 người, có mái che', courtCount: 2, latitude: 10.7867, longitude: 106.7485 },
    { name: 'Sân Tân Bình', address: '789 Đường Cộng Hòa, Quận Tân Bình', phone: '0901234569', pricePerHour: 180000, description: 'Sân 7 người', courtCount: 2, latitude: 10.8012, longitude: 106.6525 },
    { name: 'Sân Mini Gò Vấp', address: '321 Đường Quang Trung, Quận Gò Vấp', phone: '0901234570', pricePerHour: 150000, description: 'Sân 5 người mini', courtCount: 3, latitude: 10.8386, longitude: 106.6651 }
  ],
  'pickleball': [
    { name: 'Pickleball Arena', address: '111 Đường Nguyễn Văn Cừ, Quận 5', phone: '0902345671', pricePerHour: 100000, description: 'Sân trong nhà, điều hòa', courtCount: 4, latitude: 10.7590, longitude: 106.6832 },
    { name: 'Pickleball VIP Center', address: '222 Đường Hậu Giang, Quận 6', phone: '0902345672', pricePerHour: 100000, description: 'Sân VIP', courtCount: 2, latitude: 10.7468, longitude: 106.6352 },
    { name: 'Pickleball Park', address: '333 Đường Nguyễn Thị Thập, Quận 7', phone: '0902345673', pricePerHour: 90000, description: 'Sân tiêu chuẩn', courtCount: 3, latitude: 10.7375, longitude: 106.7218 }
  ],
  'badminton': [
    { name: 'Nhà Thi Đấu Rạch Miễu', address: '444 Đường Rạch Miễu, Quận Phú Nhuận', phone: '0903456781', pricePerHour: 100000, description: 'Sân trong nhà, điều hòa', courtCount: 4, latitude: 10.7994, longitude: 106.6850 },
    { name: 'CLB Cầu Lông Tân Phú', address: '555 Đường Lũy Bán Bích, Quận Tân Phú', phone: '0903456782', pricePerHour: 100000, description: 'Sân VIP', courtCount: 3, latitude: 10.7921, longitude: 106.6278 },
    { name: 'Sân Cầu Lông Thủ Đức', address: '666 Đường Võ Văn Ngân, TP Thủ Đức', phone: '0903456783', pricePerHour: 90000, description: 'Sân tiêu chuẩn', courtCount: 2, latitude: 10.8510, longitude: 106.7719 }
  ],
  'tennis': [
    { name: 'Sân Tennis Lan Anh', address: '777 Đường Hoàng Văn Thụ, Quận Tân Bình', phone: '0904567891', pricePerHour: 300000, description: 'Sân ngoài trời, mặt sân cứng', courtCount: 2, latitude: 10.7988, longitude: 106.6614 },
    { name: 'Tennis Club Phú Mỹ Hưng', address: '888 Đường Nguyễn Đức Cảnh, Quận 7', phone: '0904567892', pricePerHour: 350000, description: 'Sân VIP, có mái che', courtCount: 3, latitude: 10.7293, longitude: 106.7177 }
  ],
  'basketball': [
    { name: 'Sân Bóng Rổ CIS', address: '999 Đường Điện Biên Phủ, Bình Thạnh', phone: '0905678901', pricePerHour: 250000, description: 'Sân trong nhà, sàn gỗ', courtCount: 2, latitude: 10.8015, longitude: 106.7107 },
    { name: 'Sân Bóng Rổ Hoa Lư', address: '1010 Đường Đinh Tiên Hoàng, Quận 1', phone: '0905678902', pricePerHour: 250000, description: 'Sân tiêu chuẩn NBA', courtCount: 2, latitude: 10.7868, longitude: 106.6942 }
  ],
  'volleyball': [
    { name: 'Sân Bóng Chuyền Quân Khu 7', address: '1111 Đường Hoàng Hoa Thám, Tân Bình', phone: '0906789012', pricePerHour: 150000, description: 'Sân trong nhà', courtCount: 2, latitude: 10.8023, longitude: 106.6482 },
    { name: 'Sân Bóng Chuyền Phan Đình Phùng', address: '1212 Đường Phan Đình Phùng, Gò Vấp', phone: '0906789013', pricePerHour: 150000, description: 'Sân tiêu chuẩn', courtCount: 2, latitude: 10.8291, longitude: 106.6656 }
  ]
};

async function seed() {
  try {
    // Connect to MySQL
    await sequelize.authenticate();
    console.log('✅ Connected to MySQL');

    // Sync database (create tables)
    await sequelize.sync({ force: true }); // WARNING: This will drop all tables!
    console.log('✅ Database synced (tables created)');

    // Insert Sports
    console.log('\n📊 Inserting sports...');
    const sports = await Sport.bulkCreate(sportsData);
    console.log(`✅ Inserted ${sports.length} sports:`);
    sports.forEach(sport => {
      console.log(`   - ${sport.nameVi} (${sport.name})`);
    });

    // Insert Facilities
    console.log('\n🏟️  Inserting facilities...');
    let totalFacilities = 0;

    for (const sport of sports) {
      const sportFacilities = facilitiesData[sport.name];
      if (sportFacilities) {
        const facilitiesWithSportId = sportFacilities.map(f => ({
          ...f,
          sportId: sport.id
        }));

        await Facility.bulkCreate(facilitiesWithSportId);
        totalFacilities += facilitiesWithSportId.length;
        console.log(`   - Added ${facilitiesWithSportId.length} facilities for ${sport.nameVi}`);
      }
    }
    console.log(`✅ Inserted ${totalFacilities} facilities total`);

    // Create admin user
    console.log('\n👤 Creating admin user...');
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@sports.com',
      phone: '0900000000',
      password: 'admin123', // Will be hashed by beforeCreate hook
      role: 'admin'
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);
    console.log(`   Password: admin123`);

    // Create regular user
    const regularUser = await User.create({
      name: 'Nguyễn Văn A',
      email: 'user@sports.com',
      phone: '0911111111',
      password: 'user123',
      role: 'user'
    });
    console.log(`✅ Regular user created: ${regularUser.email}`);
    console.log(`   Password: user123`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Sports: ${sports.length}`);
    console.log(`   - Facilities: ${totalFacilities}`);
    console.log(`   - Users: 2 (1 admin, 1 user)`);
    console.log('\n🚀 You can now start the server with: npm run dev');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
