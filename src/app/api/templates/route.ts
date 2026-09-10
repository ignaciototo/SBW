import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const templates = db.prepare('SELECT * FROM templates ORDER BY titulo ASC').all();
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { titulo, tipo, contenido } = body;

    if (!titulo || !contenido) {
      return NextResponse.json({ error: 'Título y contenido son obligatorios' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO templates (titulo, tipo, contenido)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(titulo.trim(), tipo || 'escrito', contenido);
    const newTemplate = db.prepare('SELECT * FROM templates WHERE id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json({ template: newTemplate }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, titulo, tipo, contenido } = body;

    if (!id || !titulo || !contenido) {
      return NextResponse.json({ error: 'ID, título y contenido son requeridos' }, { status: 400 });
    }

    db.prepare('UPDATE templates SET titulo = ?, tipo = ?, contenido = ? WHERE id = ?').run(
      titulo.trim(),
      tipo || 'escrito',
      contenido,
      id
    );

    const updated = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
    return NextResponse.json({ template: updated });
  } catch (error: any) {
    console.error('Error updating template:', error);
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

    db.prepare('DELETE FROM templates WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
