const db = require('better-sqlite3')('database.sqlite');

try {
  console.log('Iniciando migración de Jurisdicciones...');

  // 1. Crear tabla de jurisdicciones
  db.prepare(`
    CREATE TABLE IF NOT EXISTS jurisdictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre VARCHAR(100) NOT NULL,
        hora_gracia VARCHAR(10) NOT NULL
    )
  `).run();
  console.log('Tabla jurisdictions creada (o ya existía).');

  // 2. Agregar jurisdiction_id a cases
  try {
    db.prepare('ALTER TABLE cases ADD COLUMN jurisdiction_id INTEGER REFERENCES jurisdictions(id)').run();
    console.log('Columna jurisdiction_id agregada a cases.');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('La columna jurisdiction_id ya existía en cases.');
    } else {
      throw err;
    }
  }

  // 3. Agregar fecha_gracia y hora_gracia a agenda_events
  try {
    db.prepare('ALTER TABLE agenda_events ADD COLUMN fecha_gracia DATE').run();
    console.log('Columna fecha_gracia agregada a agenda_events.');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('La columna fecha_gracia ya existía en agenda_events.');
    } else {
      throw err;
    }
  }

  try {
    db.prepare('ALTER TABLE agenda_events ADD COLUMN hora_gracia VARCHAR(10)').run();
    console.log('Columna hora_gracia agregada a agenda_events.');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('La columna hora_gracia ya existía en agenda_events.');
    } else {
      throw err;
    }
  }

  console.log('Migración completada exitosamente.');
} catch (error) {
  console.error('Error durante la migración:', error);
}
