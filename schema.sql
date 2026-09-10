-- schema.sql
-- Estructura de base de datos propuesta para la aplicación de Gestión Jurídica

-- Tabla de Usuarios (Autenticación y Roles)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK(role IN ('abogado', 'administrativo')),
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Abogados del Estudio (ABM de profesionales)
CREATE TABLE lawyers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE, -- Puede estar vinculado a un usuario del sistema (opcional)
    nombre VARCHAR(100) NOT NULL,
    matricula VARCHAR(100) NOT NULL,
    cuit VARCHAR(20),
    domicilio_constituido VARCHAR(255),
    domicilio_electronico VARCHAR(100),
    banco VARCHAR(100),
    titular_cuenta VARCHAR(100),
    alias VARCHAR(100),
    cbu VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de Clientes
CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    doc VARCHAR(50), -- DNI o CUIT
    telefono VARCHAR(50),
    email VARCHAR(100),
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Expedientes (Causas)
CREATE TABLE cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caratula VARCHAR(255) NOT NULL,
    fuero VARCHAR(50),
    juzgado VARCHAR(100),
    numero VARCHAR(50),
    cliente_id INTEGER NOT NULL,
    lawyer_id INTEGER, -- Abogado a cargo del caso
    estado VARCHAR(50) DEFAULT 'activo',
    responsable_user_id INTEGER, -- Usuario responsable/seguimiento
    notas TEXT,
    contraparte_nombre VARCHAR(100),
    contraparte_abogado VARCHAR(100),
    contraparte_contacto VARCHAR(100),
    link_portal VARCHAR(255),
    ruta_carpeta VARCHAR(255),
    jurisdiction_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clients(id),
    FOREIGN KEY (lawyer_id) REFERENCES lawyers(id),
    FOREIGN KEY (responsable_user_id) REFERENCES users(id),
    FOREIGN KEY (jurisdiction_id) REFERENCES jurisdictions(id)
);

-- Tabla de Plantillas / Formatos
CREATE TABLE formats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(50),
    contenido TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Tipos de Trámite
CREATE TABLE procedure_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    dias INTEGER NOT NULL,
    modo VARCHAR(20) CHECK(modo IN ('habiles', 'corridos')) NOT NULL
);

-- Tabla de Jurisdicciones
CREATE TABLE jurisdictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    hora_gracia VARCHAR(10) NOT NULL
);

-- Tabla de Honorarios
CREATE TABLE fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(15, 2) NOT NULL,
    moneda VARCHAR(20) DEFAULT 'Pesos' CHECK(moneda IN ('Pesos', 'USD', 'JUS')),
    cuotas INTEGER DEFAULT 1,
    pagado DECIMAL(15, 2) DEFAULT 0,
    fecha_vencimiento DATE,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- Tabla de Pagos de Honorarios (Múltiples cuotas/pagos parciales)
CREATE TABLE fee_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fee_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    monto DECIMAL(15, 2) NOT NULL,
    comprobante VARCHAR(255),
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE
);

-- Tabla de Gastos y Adelantos (Fondo de Reserva)
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    tipo VARCHAR(20) DEFAULT 'gasto' CHECK(tipo IN ('gasto', 'adelanto')),
    concepto VARCHAR(255) NOT NULL,
    importe DECIMAL(15, 2) NOT NULL,
    pagado_por VARCHAR(50) DEFAULT 'estudio',
    reintegrado BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- Tabla de Documentos
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    fecha DATE,
    ruta_archivo VARCHAR(500),
    uploaded_by_user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

-- Tabla de Eventos de Agenda
CREATE TABLE agenda_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER,
    fecha DATE NOT NULL,
    hora VARCHAR(10),
    fecha_gracia DATE,
    hora_gracia VARCHAR(10),
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'cumplido')),
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    movement_id INTEGER,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (movement_id) REFERENCES movements(id) ON DELETE CASCADE
);

-- Tabla de Ferias Judiciales
CREATE TABLE holidays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    desde DATE NOT NULL,
    hasta DATE NOT NULL
);
