const mongoose = require('mongoose');
const Sport = require('./models/Sport');
require('dotenv').config();

const sportsData = [
  {
    name: 'football',
    nameVi: 'Bóng Đá',
    description: 'Sân bóng đá chất lượng cao, phù hợp cho các trận đấu và luyện tập',
    pricePerHour: 200000,
    facilities: [
      { name: 'Sân 1', capacity: 22, available: true },
      { name: 'Sân 2', capacity: 22, available: true },
      { name: 'Sân 3', capacity: 22, available: true },
      { name: 'Sân 5 người', capacity: 10, available: true }
    ]
  },
  {
    name: 'pickleball',
    nameVi: 'Pickleball',
    description: 'Sân Pickleball trong nhà, có điều hòa, ánh sáng tốt',
    pricePerHour: 100000,
    facilities: [
      { name: 'Sân 1', capacity: 4, available: true },
      { name: 'Sân 2', capacity: 4, available: true },
      { name: 'Sân 3', capacity: 4, available: true },
      { name: 'Sân 4', capacity: 4, available: true },
      { name: 'Sân 5', capacity: 4, available: true },
      { name: 'Sân 6', capacity: 4, available: true }
    ]
  },
  {
    name: 'badminton',
    nameVi: 'Cầu Lông',
    description: 'Sân cầu lông trong nhà, có điều hòa, ánh sáng tốt',
    pricePerHour: 100000,
    facilities: [
      { name: 'Sân 1', capacity: 4, available: true },
      { name: 'Sân 2', capacity: 4, available: true },
      { name: 'Sân 3', capacity: 4, available: true },
      { name: 'Sân 4', capacity: 4, available: true },
      { name: 'Sân 5', capacity: 4, available: true },
      { name: 'Sân 6', capacity: 4, available: true }
    ]
  },
  {
    name: 'tennis',
    nameVi: 'Tennis',
    description: 'Sân tennis ngoài trời, mặt sân đẹp.',
    pricePerHour: 300000,
    facilities: [
      { name: 'Sân 1', capacity: 4, available: true },
      { name: 'Sân 2', capacity: 4, available: true },
      { name: 'Sân 3', capacity: 4, available: true }
    ]
  },
  {
    name: 'basketball',
    nameVi: 'Bóng Rổ',
    description: 'Sân bóng rổ trong nhà, sàn gỗ, có điều hòa',
    pricePerHour: 250000,
    facilities: [
      { name: 'Sân 1', capacity: 10, available: true },
      { name: 'Sân 2', capacity: 10, available: true }
    ]
  },
  
  {
    name: 'volleyball',
    nameVi: 'Bóng Chuyền',
    description: 'Sân bóng chuyền trong nhà, lưới chuẩn, sàn chống trượt',
    pricePerHour: 150000,
    facilities: [
      { name: 'Sân 1', capacity: 12, available: true },
      { name: 'Sân 2', capacity: 12, available: true }
    ]
  }
];

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://iamhoangtubest:asdasd123A@cluster0.ccg59.mongodb.net/sport', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing sports
    await Sport.deleteMany({});
    console.log('Cleared existing sports');

    // Insert new sports
    const sports = await Sport.insertMany(sportsData);
    console.log(`Inserted ${sports.length} sports:`);
    sports.forEach(sport => {
      console.log(`- ${sport.nameVi} (${sport.name})`);
    });

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
