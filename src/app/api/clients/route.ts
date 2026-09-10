import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const clients = db.prepare(`
      SELECT c.*, COUNT(ca.id) AS total_cases 
      FROM clients c 
      LEFT JOIN cases ca ON ca.cliente_id = c.id 
      GROUP BY c.id 
      ORDER BY c.nombre ASC
    `).all();

    return NextResponse.json({ clients });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, doc, telefono, email, notas } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO clients (nombre, doc, telefono, email, notas) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nombre.trim(),
      doc?.trim() || null,
      telefono?.trim() || null,
      email?.trim() || null,
      notas?.trim() || null
    );

    const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nombre, doc, telefono, email, notas } = body;

    if (!id || !nombre?.trim()) {
      return NextResponse.json({ error: 'ID y nombre son obligatorios' }, { status: 400 });
    }

    db.prepare(`
      UPDATE clients 
      SET nombre = ?, doc = ?, telefono = ?, email = ?, notas = ? 
      WHERE id = ?
    `).run(
      nombre.trim(),
      doc?.trim() || null,
      telefono?.trim() || null,
      email?.trim() || null,
      notas?.trim() || null,
      id
    );

    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    return NextResponse.json({ client: updated });
  } catch (error: any) {
    console.error('Error updating client:', error);
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

    // Verificar si tiene causas asociadas
    const casesCount = db.prepare('SELECT COUNT(*) as count FROM cases WHERE cliente_id = ?').get(id) as { count: number };
    if (casesCount.count > 0) {
      return NextResponse.json({ error: 'No se puede eliminar un cliente con causas asociadas' }, { status: 400 });
    }

    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
