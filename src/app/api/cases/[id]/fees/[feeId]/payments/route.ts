import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string, feeId: string }> }
) {
  try {
    const { feeId } = await params;
    const body = await req.json();
    const { monto, fecha, comprobante, notas } = body;

    const stmt = db.prepare(`
      INSERT INTO fee_payments (fee_id, fecha, monto, comprobante, notas)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(feeId, fecha || new Date().toISOString().split('T')[0], monto, comprobante || null, notas || null);
    
    // Opcional: Actualizar el total pagado en la tabla fees
    db.prepare(`
      UPDATE fees 
      SET pagado = (SELECT SUM(monto) FROM fee_payments WHERE fee_id = ?)
      WHERE id = ?
    `).run(feeId, feeId);

    const newPayment = db.prepare('SELECT * FROM fee_payments WHERE id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json({ payment: newPayment }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding fee payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string, feeId: string }> }
) {
  try {
    const { feeId } = await params;
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'Falta paymentId' }, { status: 400 });
    }

    db.prepare('DELETE FROM fee_payments WHERE id = ?').run(paymentId);

    // Actualizar total pagado
    db.prepare(`
      UPDATE fees 
      SET pagado = IFNULL((SELECT SUM(monto) FROM fee_payments WHERE fee_id = ?), 0)
      WHERE id = ?
    `).run(feeId, feeId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting fee payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
