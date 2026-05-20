const fs = require('fs');

const path = '../sports_booking_fixed.sql';
let content = fs.readFileSync(path, 'utf8');

// Replace problematic collation
content = content.replace(/utf8mb4_0900_ai_ci/g, 'utf8mb4_general_ci');

// Replace CREATE TABLE IF NOT EXISTS with DROP TABLE + CREATE TABLE
content = content.replace(/CREATE TABLE IF NOT EXISTS `([^`]+)`/g, 'DROP TABLE IF EXISTS `$1`;\nCREATE TABLE `$1`');

fs.writeFileSync('../sports_booking_ready_for_cpanel.sql', content);
console.log('Fixed SQL generated at sports_booking_ready_for_cpanel.sql');
