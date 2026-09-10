import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const jurisdictions = db.prepare('SELECT * FROM jurisdictions ORDER BY nombre ASC').all();
    return NextResponse.json({ jurisdictions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, hora_gracia } = body;

    if (!nombre || !hora_gracia) {
      return NextResponse.json({ error: 'Nombre y hora_gracia son requeridos' }, { status: 400 });
    }

    const stmt = db.prepare('INSERT INTO jurisdictions (nombre, hora_gracia) VALUES (?, ?)');
    const res = stmt.run(nombre, hora_gracia);
    
    const newJurisdiction = db.prepare('SELECT * FROM jurisdictions WHERE id = ?').get(res.lastInsertRowid);
    return NextResponse.json({ jurisdiction: newJurisdiction }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    db.prepare('DELETE FROM jurisdictions WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
