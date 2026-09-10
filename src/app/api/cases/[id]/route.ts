import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caseItem = db.prepare(`
      SELECT 
        c.*, 
        cl.nombre AS cliente_nombre,
        cl.doc AS cliente_doc,
        cl.telefono AS cliente_telefono,
        cl.email AS cliente_email,
        l.nombre AS lawyer_nombre,
        l.matricula AS lawyer_matricula,
        l.cuit AS lawyer_cuit,
        l.domicilio_constituido AS lawyer_domicilio,
        l.domicilio_electronico AS lawyer_electronico,
        j.nombre AS jurisdiction_nombre,
        j.hora_gracia
      FROM cases c
      LEFT JOIN clients cl ON cl.id = c.cliente_id
      LEFT JOIN lawyers l ON l.id = c.lawyer_id
      LEFT JOIN jurisdictions j ON j.id = c.jurisdiction_id
      WHERE c.id = ?
    `).get(id);

    if (!caseItem) {
      return NextResponse.json({ error: 'Causa no encontrada' }, { status: 404 });
    }

    const movements = db.prepare(`
      SELECT m.*, 
             a.id AS agenda_event_id, 
             a.fecha AS agenda_fecha, 
             a.fecha_gracia AS agenda_fecha_gracia, 
             a.hora_gracia AS agenda_hora_gracia, 
             a.estado AS agenda_estado
      FROM movements m
      LEFT JOIN agenda_events a ON a.movement_id = m.id
      WHERE m.case_id = ? 
      ORDER BY m.fecha DESC, m.id DESC
    `).all(id);

    const agenda = db.prepare(`
      SELECT * FROM agenda_events 
      WHERE case_id = ? 
      ORDER BY fecha ASC
    `).all(id);

    const documents = db.prepare(`
      SELECT * FROM documents 
      WHERE case_id = ? 
      ORDER BY id DESC
    `).all(id);

    const fees = db.prepare(`
      SELECT * FROM fees 
      WHERE case_id = ? 
      ORDER BY created_at DESC
    `).all(id);

    const fee_payments = db.prepare(`
      SELECT p.* FROM fee_payments p
      JOIN fees f ON f.id = p.fee_id
      WHERE f.case_id = ?
      ORDER BY p.fecha DESC
    `).all(id);

    // Attach payments to fees
    const feesWithPayments = fees.map((fee: any) => ({
      ...fee,
      payments: fee_payments.filter((p: any) => p.fee_id === fee.id)
    }));

    const expenses = db.prepare(`
      SELECT * FROM expenses 
      WHERE case_id = ? 
      ORDER BY fecha DESC, created_at DESC
    `).all(id);

    return NextResponse.json({
      case: caseItem,
      movements,
      agenda,
      documents,
      fees: feesWithPayments,
      expenses
    });
  } catch (error: any) {
    console.error('Error fetching case detail:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
