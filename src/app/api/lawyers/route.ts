import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    let lawyers = db.prepare('SELECT * FROM lawyers ORDER BY nombre ASC').all();
    
    // Si no hay abogados cargados, agregamos uno por defecto del estudio
    if (lawyers.length === 0) {
      db.prepare(`
        INSERT INTO lawyers (nombre, matricula, cuit, domicilio_constituido, domicilio_electronico)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'Dr. Estudio Jurídico',
        'T° 100 F° 500 CPACF',
        '20-30405060-7',
        'Lavalle 1234 Piso 4, CABA',
        'estudio@notificaciones.gob.ar'
      );
      lawyers = db.prepare('SELECT * FROM lawyers ORDER BY nombre ASC').all();
    }

    return NextResponse.json({ lawyers });
  } catch (error: any) {
    console.error('Error fetching lawyers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, matricula, cuit, domicilio_constituido, domicilio_electronico, banco, titular_cuenta, alias, cbu } = body;

    if (!nombre || !matricula) {
      return NextResponse.json({ error: 'Nombre y matrícula son requeridos' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO lawyers (nombre, matricula, cuit, domicilio_constituido, domicilio_electronico, banco, titular_cuenta, alias, cbu)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nombre.trim(), matricula.trim(), cuit?.trim() || null, 
      domicilio_constituido?.trim() || null, domicilio_electronico?.trim() || null,
      banco?.trim() || null, titular_cuenta?.trim() || null, 
      alias?.trim() || null, cbu?.trim() || null
    );

    const newLawyer = db.prepare('SELECT * FROM lawyers WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ lawyer: newLawyer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lawyer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nombre, matricula, cuit, domicilio_constituido, domicilio_electronico, banco, titular_cuenta, alias, cbu } = body;

    if (!id || !nombre || !matricula) {
      return NextResponse.json({ error: 'ID, nombre y matrícula son requeridos' }, { status: 400 });
    }

    db.prepare(`
      UPDATE lawyers SET 
        nombre = ?, matricula = ?, cuit = ?, domicilio_constituido = ?, 
        domicilio_electronico = ?, banco = ?, titular_cuenta = ?, alias = ?, cbu = ?
      WHERE id = ?
    `).run(
      nombre.trim(), matricula.trim(), cuit?.trim() || null, 
      domicilio_constituido?.trim() || null, domicilio_electronico?.trim() || null,
      banco?.trim() || null, titular_cuenta?.trim() || null, 
      alias?.trim() || null, cbu?.trim() || null,
      id
    );

    const updated = db.prepare('SELECT * FROM lawyers WHERE id = ?').get(id);
    return NextResponse.json({ lawyer: updated });
  } catch (error: any) {
    console.error('Error updating lawyer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    // Verificar si está asignado a causas
    const casesCount = db.prepare('SELECT COUNT(*) as count FROM cases WHERE lawyer_id = ?').get(id) as { count: number };
    if (casesCount.count > 0) {
      return NextResponse.json({ error: 'No se puede eliminar un abogado que tiene causas asignadas' }, { status: 400 });
    }

    db.prepare('DELETE FROM lawyers WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting lawyer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
