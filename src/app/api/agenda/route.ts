import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const events = db.prepare(`
      SELECT a.*, c.caratula, c.numero
      FROM agenda_events a
      LEFT JOIN cases c ON c.id = a.case_id
      ORDER BY a.fecha ASC
    `).all();

    const feeEvents = db.prepare(`
      SELECT f.id, f.case_id, f.concepto, f.fecha_vencimiento as fecha, c.caratula, f.monto, f.pagado, f.moneda
      FROM fees f
      LEFT JOIN cases c ON c.id = f.case_id
      WHERE f.fecha_vencimiento IS NOT NULL
        AND f.pagado < f.monto
    `).all().map((f: any) => ({
      id: `fee-${f.id}`,
      case_id: f.case_id,
      caratula: f.caratula,
      fecha: f.fecha,
      fecha_gracia: null,
      hora_gracia: null,
      titulo: `Cobro Honorario: ${f.concepto} (Falta ${f.moneda} ${f.monto - f.pagado})`,
      tipo: 'cobro_honorario',
      estado: 'pendiente',
      notas: ''
    }));

    const combinedEvents = [...events, ...feeEvents].sort((a: any, b: any) => {
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    });

    return NextResponse.json({ events: combinedEvents });
  } catch (error: any) {
    console.error('Error fetching agenda:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { case_id, fecha, hora, fecha_gracia, hora_gracia, titulo, tipo, notas } = body;

    if (!fecha || !titulo) {
      return NextResponse.json({ error: 'Fecha y título son obligatorios' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO agenda_events (case_id, fecha, hora, fecha_gracia, hora_gracia, titulo, tipo, notas, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')
    `);

    const res = stmt.run(
      case_id ? Number(case_id) : null,
      fecha,
      hora || null,
      fecha_gracia || null,
      hora_gracia || null,
      titulo.trim(),
      tipo || 'vencimiento_plazo',
      notas?.trim() || null
    );

    const newEv = db.prepare('SELECT * FROM agenda_events WHERE id = ?').get(res.lastInsertRowid);
    return NextResponse.json({ event: newEv }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, estado } = body;

    if (!id || !estado) {
      return NextResponse.json({ error: 'ID y estado requeridos' }, { status: 400 });
    }

    db.prepare('UPDATE agenda_events SET estado = ? WHERE id = ?').run(estado, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating event:', error);
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

    db.prepare('DELETE FROM agenda_events WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
