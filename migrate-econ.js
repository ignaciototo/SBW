const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  console.log('Migrating database...');
  
  // 1. Alter fees table
  try {
    db.prepare("ALTER TABLE fees ADD COLUMN moneda VARCHAR(20) DEFAULT 'Pesos'").run();
    console.log('Added moneda to fees.');
  } catch (e) {
    console.log('Column moneda already exists or error:', e.message);
  }

  // 2. Alter expenses table
  try {
    db.prepare("ALTER TABLE expenses ADD COLUMN tipo VARCHAR(20) DEFAULT 'gasto'").run();
    console.log('Added tipo to expenses.');
  } catch (e) {
    console.log('Column tipo already exists or error:', e.message);
  }

  // 3. Create fee_payments table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS fee_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fee_id INTEGER NOT NULL,
        fecha DATE NOT NULL,
        monto DECIMAL(15, 2) NOT NULL,
        comprobante VARCHAR(255),
        notas TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE
    )
  `).run();
  console.log('Created fee_payments table.');

  console.log('Migration successful.');
} catch (error) {
  console.error('Migration failed:', error);
} finally {
  db.close();
}
