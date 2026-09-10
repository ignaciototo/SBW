import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const procedureTypes = db.prepare('SELECT * FROM procedure_types ORDER BY nombre ASC').all();
    return NextResponse.json({ procedureTypes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, dias, modo } = body;

    if (!nombre || dias === undefined || !modo) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO procedure_types (nombre, dias, modo)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(nombre.trim(), Number(dias), modo);
    const newType = db.prepare('SELECT * FROM procedure_types WHERE id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json({ procedureType: newType }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta ID' }, { status: 400 });
    }

    db.prepare('DELETE FROM procedure_types WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
