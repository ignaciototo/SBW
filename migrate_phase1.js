const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
const database = new Database(dbPath);

console.log('Creando tabla templates...');
database.exec(`
  CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo VARCHAR(255) NOT NULL,
      tipo VARCHAR(50),
      contenido TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('Tabla templates creada correctamente.');
