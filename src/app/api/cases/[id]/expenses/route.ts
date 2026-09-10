import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expenses = db.prepare('SELECT * FROM expenses WHERE case_id = ? ORDER BY fecha DESC, created_at DESC').all(id);
    return NextResponse.json({ expenses });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
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
    const { fecha, concepto, importe, tipo = 'gasto', pagado_por = 'estudio', reintegrado = 0 } = body;

    const stmt = db.prepare(`
      INSERT INTO expenses (case_id, fecha, concepto, importe, tipo, pagado_por, reintegrado)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(id, fecha, concepto, importe, tipo, pagado_por, reintegrado ? 1 : 0);
    const newExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding expense:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get('expenseId');

    if (!expenseId) {
      return NextResponse.json({ error: 'Falta expenseId' }, { status: 400 });
    }

    db.prepare('DELETE FROM expenses WHERE id = ?').run(expenseId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
