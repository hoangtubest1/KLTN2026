require('dotenv').config();
const { sequelize, Booking } = require('./models');

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    // Check if vnpayTxnRef column exists
    const [results] = await sequelize.query("SHOW COLUMNS FROM bookings LIKE 'vnpayTxnRef'");
    console.log('\nvnpayTxnRef column:', results.length > 0 ? 'EXISTS' : 'MISSING!');
    if (results.length > 0) {
      console.log('Column details:', JSON.stringify(results[0]));
    }
    
    // List all bookings
    const [bookings] = await sequelize.query("SELECT id, vnpayTxnRef, status, paymentStatus, customerEmail, createdAt FROM bookings ORDER BY id DESC LIMIT 10");
    console.log('\nAll bookings:');
    bookings.forEach(b => {
      console.log(`  #${b.id} | txnRef: ${b.vnpayTxnRef || 'null'} | status: ${b.status} | payment: ${b.paymentStatus} | ${b.customerEmail} | ${b.createdAt}`);
    });
    
    // Try to create a test booking with vnpayTxnRef
    console.log('\nTesting vnpayTxnRef save...');
    const testRef = 'TEST_' + Date.now();
    const [insertResult] = await sequelize.query(
      `INSERT INTO bookings (sportId, facilityName, customerName, customerPhone, customerEmail, date, startTime, endTime, duration, totalPrice, status, paymentMethod, paymentStatus, vnpayTxnRef, createdAt, updatedAt) VALUES (1, 'Test', 'Test', '0123456789', 'test@test.com', '2026-03-25', '08:00:00', '09:00:00', 1, 100000, 'pending_payment', 'vnpay', 'unpaid', '${testRef}', NOW(), NOW())`
    );
    console.log('Insert result:', insertResult);
    
    // Verify
    const [verify] = await sequelize.query(`SELECT id, vnpayTxnRef FROM bookings WHERE vnpayTxnRef = '${testRef}'`);
    console.log('Verify:', verify.length > 0 ? `Found! id=${verify[0].id}` : 'NOT FOUND!');
    
    // Cleanup test
    if (verify.length > 0) {
      await sequelize.query(`DELETE FROM bookings WHERE id = ${verify[0].id}`);
      console.log('Test booking cleaned up');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
