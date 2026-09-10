import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const holidays = db.prepare('SELECT * FROM holidays ORDER BY desde ASC').all();
    return NextResponse.json({ holidays });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, desde, hasta } = body;

    if (!nombre || !desde || !hasta) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO holidays (nombre, desde, hasta)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(nombre.trim(), desde, hasta);
    const newHoliday = db.prepare('SELECT * FROM holidays WHERE id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json({ holiday: newHoliday }, { status: 201 });
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

    db.prepare('DELETE FROM holidays WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
