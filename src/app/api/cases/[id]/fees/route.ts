import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fees = db.prepare('SELECT * FROM fees WHERE case_id = ? ORDER BY created_at DESC').all(id);
    return NextResponse.json({ fees });
  } catch (error: any) {
    console.error('Error fetching fees:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { concepto, monto, moneda = 'Pesos', cuotas = 1, pagado = 0, fecha_vencimiento, notas } = body;

    const stmt = db.prepare(`
      INSERT INTO fees (case_id, concepto, monto, moneda, cuotas, pagado, fecha_vencimiento, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(id, concepto, monto, moneda, cuotas, pagado, fecha_vencimiento || null, notas || null);
    const newFee = db.prepare('SELECT * FROM fees WHERE id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json({ fee: newFee }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding fee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const feeId = searchParams.get('feeId');

    if (!feeId) {
      return NextResponse.json({ error: 'Falta feeId' }, { status: 400 });
    }

    db.prepare('DELETE FROM fees WHERE id = ?').run(feeId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting fee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
