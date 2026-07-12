// Quick cleanup script for E2E test data
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const tables = [
    'Payment', 'Reservation', 'Consumption', 'Guest', 'Room',
    'RoomCategory', 'Tariff', 'Season', 'HotelIntegration',
    'MaintenanceOrder', 'CleaningTask', 'InventoryMovement',
    'InventoryItem', 'Expense', 'IcalSync', 'SystemErrorLog',
    'AuditLog', 'WebhookEvent'
  ];

  // Delete all E2E data
  for (const table of tables) {
    await pool.query(`DELETE FROM "${table}" WHERE "hotel_id" IN (SELECT id FROM "Hotel" WHERE nome LIKE 'E2E%')`);
  }
  await pool.query(`DELETE FROM "Branch" WHERE "hotel_id" IN (SELECT id FROM "Hotel" WHERE nome LIKE 'E2E%')`);
  await pool.query(`DELETE FROM "User" WHERE "hotel_id" IN (SELECT id FROM "Hotel" WHERE nome LIKE 'E2E%')`);

  // Delete platform owner users created by E2E tests
  await pool.query(`DELETE FROM "User" WHERE email LIKE '%e2erls.com'`);
  await pool.query(`DELETE FROM "User" WHERE email LIKE '%e2eob.com'`);
  await pool.query(`DELETE FROM "User" WHERE email LIKE '%e2emp.com'`);
  await pool.query(`DELETE FROM "User" WHERE email LIKE '%e2eyield.com'`);
  await pool.query(`DELETE FROM "User" WHERE email LIKE '%e2ecross.com'`);
  await pool.query(`DELETE FROM "User" WHERE email LIKE '%e2erw.com'`);

  await pool.query(`DELETE FROM "Hotel" WHERE nome LIKE 'E2E%'`);

  console.log('Cleanup complete');
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
