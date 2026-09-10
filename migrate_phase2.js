const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
const database = new Database(dbPath);

console.log('Creando tabla tramites...');
database.exec(`
  CREATE TABLE IF NOT EXISTS tramites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo VARCHAR(255) NOT NULL,
      cliente_id INTEGER,
      estado VARCHAR(50) DEFAULT 'pendiente',
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clients(id) ON DELETE SET NULL
  );
`);
console.log('Tabla tramites creada correctamente.');
