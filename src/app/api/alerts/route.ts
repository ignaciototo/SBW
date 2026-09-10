import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Buscar eventos en la agenda que vencen hoy, en los próximos 2 días, o que ya están vencidos y pendientes
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 2);

    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];

    const alerts = db.prepare(`
      SELECT a.*, c.caratula 
      FROM agenda_events a
      LEFT JOIN cases c ON c.id = a.case_id
      WHERE a.estado = 'pendiente'
        AND a.fecha <= ?
      ORDER BY a.fecha ASC
    `).all(futureStr);

    const feeAlerts = db.prepare(`
      SELECT f.id, f.case_id, f.concepto, f.fecha_vencimiento as fecha, c.caratula, f.monto, f.pagado, f.moneda
      FROM fees f
      LEFT JOIN cases c ON c.id = f.case_id
      WHERE f.fecha_vencimiento IS NOT NULL
        AND f.fecha_vencimiento <= ?
        AND f.pagado < f.monto
      ORDER BY f.fecha_vencimiento ASC
    `).all(futureStr).map((f: any) => ({
      id: `fee-${f.id}`,
      case_id: f.case_id,
      caratula: f.caratula,
      fecha: f.fecha,
      titulo: `Cobro Honorario: ${f.concepto} (Falta ${f.moneda} ${f.monto - f.pagado})`,
      tipo: 'cobro_honorario',
      estado: 'pendiente'
    }));

    const combinedAlerts = [...alerts, ...feeAlerts].sort((a: any, b: any) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    return NextResponse.json({ alerts: combinedAlerts });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
