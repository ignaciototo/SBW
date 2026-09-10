import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const tramites = db.prepare(`
      SELECT t.*, c.nombre as cliente_nombre 
      FROM tramites t
      LEFT JOIN clients c ON t.cliente_id = c.id
      ORDER BY t.created_at DESC
    `).all();
    return NextResponse.json({ tramites });
  } catch (error: any) {
    console.error('Error fetching tramites:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { titulo, cliente_id, estado, notas } = body;

    if (!titulo) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO tramites (titulo, cliente_id, estado, notas)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      titulo.trim(),
      cliente_id || null,
      estado || 'pendiente',
      notas?.trim() || null
    );

    const newTramite = db.prepare(`
      SELECT t.*, c.nombre as cliente_nombre 
      FROM tramites t
      LEFT JOIN clients c ON t.cliente_id = c.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);
    
    return NextResponse.json({ tramite: newTramite }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tramite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, titulo, cliente_id, estado, notas } = body;

    if (!id || !titulo) {
      return NextResponse.json({ error: 'ID y título son requeridos' }, { status: 400 });
    }

    db.prepare('UPDATE tramites SET titulo = ?, cliente_id = ?, estado = ?, notas = ? WHERE id = ?').run(
      titulo.trim(),
      cliente_id || null,
      estado || 'pendiente',
      notas?.trim() || null,
      id
    );

    const updated = db.prepare(`
      SELECT t.*, c.nombre as cliente_nombre 
      FROM tramites t
      LEFT JOIN clients c ON t.cliente_id = c.id
      WHERE t.id = ?
    `).get(id);
    
    return NextResponse.json({ tramite: updated });
  } catch (error: any) {
    console.error('Error updating tramite:', error);
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

    db.prepare('DELETE FROM tramites WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tramite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
