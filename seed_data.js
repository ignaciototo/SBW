const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

console.log('Generando datos de prueba...');

try {
  // Crear tablas si no existen
  db.exec(`
    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      fecha DATE NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      tipo VARCHAR(50),
      descripcion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agenda_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER,
      fecha DATE NOT NULL,
      titulo VARCHAR(255) NOT NULL,
      tipo VARCHAR(50),
      estado VARCHAR(50) DEFAULT 'pendiente',
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );
  `);

  // 1. Abogado por defecto
  let lawyerId = db.prepare('SELECT id FROM lawyers LIMIT 1').get()?.id;
  if (!lawyerId) {
    const res = db.prepare('INSERT INTO lawyers (nombre, matricula) VALUES (?, ?)').run('Dr. Fernando Lopez', 'T 15 F 200');
    lawyerId = res.lastInsertRowid;
  }

  // 2. Clientes
  const clients = [
    { nombre: 'Carlos Perez', email: 'carlos@gmail.com', telefono: '1155667788', doc: '20123456789' },
    { nombre: 'Empresa SA', email: 'contacto@empresa.com', telefono: '1144552233', doc: '30778899001' },
    { nombre: 'Maria Gomez', email: 'maria.g@hotmail.com', telefono: '1166332211', doc: '27334455668' }
  ];

  const insertClient = db.prepare('INSERT INTO clients (nombre, email, telefono, doc) VALUES (?, ?, ?, ?)');
  const clientIds = [];
  for (const c of clients) {
    clientIds.push(insertClient.run(c.nombre, c.email, c.telefono, c.doc).lastInsertRowid);
  }

  // 3. Causas / Expedientes
  const cases = [
    { 
      caratula: 'PEREZ CARLOS C/ ASEGURADORA S/ DAÑOS Y PERJUICIOS', 
      numero: '12345/2023', fuero: 'Civil', juzgado: 'Juzgado Civil Nro 10', 
      cliente_id: clientIds[0], lawyer_id: lawyerId, contraparte_nombre: 'Aseguradora La Caja', estado: 'activo' 
    },
    { 
      caratula: 'EMPRESA SA C/ AFIP S/ AMPARO', 
      numero: '9988/2024', fuero: 'Contencioso Administrativo', juzgado: 'Juzgado Cont. Adm. Nro 2', 
      cliente_id: clientIds[1], lawyer_id: lawyerId, contraparte_nombre: 'AFIP', estado: 'activo' 
    },
    { 
      caratula: 'GOMEZ MARIA C/ LOPEZ JUAN S/ ALIMENTOS', 
      numero: '5544/2022', fuero: 'Familia', juzgado: 'Juzgado Familia Nro 5', 
      cliente_id: clientIds[2], lawyer_id: lawyerId, contraparte_nombre: 'Juan Lopez', estado: 'archivado' 
    }
  ];

  const insertCase = db.prepare('INSERT INTO cases (caratula, numero, fuero, juzgado, cliente_id, lawyer_id, contraparte_nombre, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const caseIds = [];
  for (const c of cases) {
    caseIds.push(insertCase.run(c.caratula, c.numero, c.fuero, c.juzgado, c.cliente_id, c.lawyer_id, c.contraparte_nombre, c.estado).lastInsertRowid);
  }

  // 4. Movimientos de Causas
  const insertMov = db.prepare('INSERT INTO movements (case_id, titulo, tipo, descripcion, fecha) VALUES (?, ?, ?, ?, ?)');
  
  // Movimientos para Causa 1
  insertMov.run(caseIds[0], 'Se sortea Juzgado', 'inicio', 'Ingreso de demanda en receptoría.', '2023-05-10');
  insertMov.run(caseIds[0], 'Traslado de Demanda', 'notificacion', 'Se corre traslado a la demandada por 15 días.', '2023-06-01');
  insertMov.run(caseIds[0], 'Contesta Demanda', 'escrito', 'La aseguradora opone falta de legitimación.', '2023-06-20');
  insertMov.run(caseIds[0], 'Apertura a Prueba', 'proveido', 'El juez ordena abrir la causa a prueba por 40 días.', '2023-08-15');

  // Movimientos para Causa 2
  insertMov.run(caseIds[1], 'Presentación de Amparo', 'inicio', 'Se solicita medida cautelar urgente.', '2024-01-10');
  insertMov.run(caseIds[1], 'Concesión de Cautelar', 'resolucion', 'El juez hace lugar a la medida cautelar innovativa.', '2024-01-15');

  // 5. Agenda / Vencimientos
  const insertAgenda = db.prepare('INSERT INTO agenda_events (titulo, tipo, fecha, case_id, estado, notas) VALUES (?, ?, ?, ?, ?, ?)');
  
  // Fechas en el futuro y pasado relativo
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
  
  insertAgenda.run('Vence plazo contestación pericia', 'vencimiento', tomorrow.toISOString().split('T')[0], caseIds[0], 'pendiente', 'Contestar impugnación del perito ingeniero.');
  insertAgenda.run('Audiencia Testimonial', 'audiencia', nextWeek.toISOString().split('T')[0], caseIds[0], 'pendiente', 'Traer a los dos testigos (Ramirez y Gonzalez). Sala 2.');
  insertAgenda.run('Presentar oficios diligenciados', 'vencimiento', today.toISOString().split('T')[0], caseIds[1], 'pendiente', 'Dejar en el juzgado soporte papel.');

  // 6. Trámites
  const insertTramite = db.prepare('INSERT INTO tramites (titulo, cliente_id, estado, notas) VALUES (?, ?, ?, ?)');
  insertTramite.run('Inscripción de declaratoria RPI', clientIds[2], 'en_proceso', 'Falta pagar tasa de justicia.');
  insertTramite.run('Alta sociedad IGJ', clientIds[1], 'pendiente', 'Esperando firmas certificadas por escribano.');

  // 7. Plantillas / Formatos
  const insertTemplate = db.prepare('INSERT INTO templates (titulo, tipo, contenido) VALUES (?, ?, ?)');
  insertTemplate.run(
    'Cédula de Notificación Básica', 
    'cedula', 
    `CÉDULA DE NOTIFICACIÓN\n\nJuzgado: {{juzgado}}\nExpediente: "{{causa.caratula}}" (Expte. {{causa.numero}})\nDestinatario: {{contraparte.nombre}}\n\nSeñor/a, me dirijo a usted a fin de notificarle la siguiente resolución dictada en los autos de referencia:\n\n"Buenos Aires, [FECHA]... [TEXTO DE LA RESOLUCIÓN]... Fdo. Juez."\n\nQueda usted debidamente notificado.\n\nFirma: {{lawyer.nombre}}`
  );
  insertTemplate.run(
    'Aviso genérico cliente', 
    'escrito', 
    `Estimado/a {{cliente.nombre}},\n\nNos dirigimos a usted en el marco de la causa "{{causa.caratula}}" de trámite por ante el {{juzgado}}, a fin de informarle el estado actual de las actuaciones.`
  );

  console.log('¡Datos de prueba generados exitosamente!');
} catch (err) {
  console.error('Error al generar datos:', err);
}
