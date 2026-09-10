import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculateDeadline } from '@/lib/calculateDeadline';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { fecha, titulo, descripcion, tipo, procedure_type_id, fecha_vencimiento, fecha_gracia, hora_gracia } = body;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json({ error: 'El título o movimiento es obligatorio' }, { status: 400 });
    }

    const dateStr = fecha || new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO movements (case_id, fecha, titulo, descripcion, tipo)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      id,
      dateStr,
      titulo.trim(),
      descripcion?.trim() || null,
      tipo || 'proveido'
    );

    const newMov = db.prepare('SELECT * FROM movements WHERE id = ?').get(result.lastInsertRowid) as any;

    // Si el usuario validó/definió una fecha de vencimiento en pantalla
    if (fecha_vencimiento) {
      db.prepare(`
        INSERT INTO agenda_events (case_id, movement_id, fecha, fecha_gracia, hora_gracia, titulo, tipo, notas, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        newMov.id,
        fecha_vencimiento,
        fecha_gracia || null,
        hora_gracia || null,
        `Vto. ${titulo.trim()}`,
        'vencimiento_plazo',
        procedure_type_id ? 'Calculado y validado en movimiento' : 'Vencimiento asignado a movimiento',
        'pendiente'
      );
    } else if (procedure_type_id) {
      // Respaldo: Auto-generación de vencimiento si se envió un procedure_type_id válido sin fechas explícitas
      const procType = db.prepare('SELECT * FROM procedure_types WHERE id = ?').get(procedure_type_id) as any;
      if (procType && procType.dias > 0) {
        // Obtener la hora de gracia de la jurisdicción de la causa
        const caseInfo = db.prepare(`
          SELECT j.hora_gracia 
          FROM cases c
          LEFT JOIN jurisdictions j ON j.id = c.jurisdiction_id
          WHERE c.id = ?
        `).get(id) as any;
        
        const hGracia = caseInfo?.hora_gracia || null;
        const deadline = await calculateDeadline(dateStr, procType.dias, procType.modo, hGracia);
        
        if (deadline.normal) {
          db.prepare(`
            INSERT INTO agenda_events (case_id, movement_id, fecha, fecha_gracia, hora_gracia, titulo, tipo, notas, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            id,
            newMov.id,
            deadline.normal,
            deadline.fecha_gracia,
            deadline.hora_gracia,
            `Vto. ${titulo.trim()}`,
            'vencimiento_plazo',
            `Calculado automáticamente por: ${procType.nombre} (${procType.dias} días ${procType.modo})`,
            'pendiente'
          );
        }
      }
    }

    return NextResponse.json({ movement: newMov }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding movement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const movId = searchParams.get('movId');

    if (!movId) {
      return NextResponse.json({ error: 'movId es obligatorio' }, { status: 400 });
    }

    db.prepare('DELETE FROM movements WHERE id = ?').run(movId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting movement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
