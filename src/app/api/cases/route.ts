import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = `
      SELECT 
        c.*, 
        cl.nombre AS cliente_nombre,
        cl.telefono AS cliente_telefono,
        cl.email AS cliente_email,
        l.nombre AS lawyer_nombre,
        (SELECT COUNT(*) FROM movements m WHERE m.case_id = c.id) AS total_movimientos,
        (SELECT MAX(m.fecha) FROM movements m WHERE m.case_id = c.id) AS ultimo_movimiento,
        j.nombre AS jurisdiction_nombre,
        j.hora_gracia
      FROM cases c
      LEFT JOIN clients cl ON cl.id = c.cliente_id
      LEFT JOIN lawyers l ON l.id = c.lawyer_id
      LEFT JOIN jurisdictions j ON j.id = c.jurisdiction_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status && status !== 'todos') {
      query += ` AND c.estado = ?`;
      params.push(status);
    }

    if (search && search.trim() !== '') {
      query += ` AND (
        c.caratula LIKE ? OR 
        c.numero LIKE ? OR 
        c.fuero LIKE ? OR 
        c.juzgado LIKE ? OR 
        cl.nombre LIKE ?
      )`;
      const wild = `%${search.trim()}%`;
      params.push(wild, wild, wild, wild, wild);
    }

    query += ` ORDER BY c.created_at DESC`;

    const cases = db.prepare(query).all(...params);
    return NextResponse.json({ cases });
  } catch (error: any) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      caratula,
      fuero,
      juzgado,
      numero,
      cliente_id,
      lawyer_id,
      estado,
      notas,
      contraparte_nombre,
      contraparte_abogado,
      contraparte_contacto,
      link_portal,
      ruta_carpeta,
      jurisdiction_id
    } = body;

    if (!caratula || !caratula.trim()) {
      return NextResponse.json({ error: 'La carátula es obligatoria' }, { status: 400 });
    }

    if (!cliente_id) {
      return NextResponse.json({ error: 'El cliente es obligatorio' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO cases (
        caratula, fuero, juzgado, numero, cliente_id, lawyer_id, estado,
        notas, contraparte_nombre, contraparte_abogado, contraparte_contacto,
        link_portal, ruta_carpeta, jurisdiction_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      caratula.trim(),
      fuero?.trim() || 'Civil y Comercial',
      juzgado?.trim() || null,
      numero?.trim() || null,
      cliente_id,
      lawyer_id || null,
      estado || 'activo',
      notas?.trim() || null,
      contraparte_nombre?.trim() || null,
      contraparte_abogado?.trim() || null,
      contraparte_contacto?.trim() || null,
      link_portal?.trim() || null,
      ruta_carpeta?.trim() || null,
      jurisdiction_id || null
    );

    const newCase = db.prepare(`
      SELECT c.*, cl.nombre AS cliente_nombre, l.nombre AS lawyer_nombre
      FROM cases c
      LEFT JOIN clients cl ON cl.id = c.cliente_id
      LEFT JOIN lawyers l ON l.id = c.lawyer_id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating case:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      caratula,
      fuero,
      juzgado,
      numero,
      cliente_id,
      lawyer_id,
      estado,
      notas,
      contraparte_nombre,
      contraparte_abogado,
      contraparte_contacto,
      link_portal,
      ruta_carpeta,
      jurisdiction_id
    } = body;

    if (!id || !caratula?.trim()) {
      return NextResponse.json({ error: 'ID y carátula son obligatorios' }, { status: 400 });
    }

    db.prepare(`
      UPDATE cases SET 
        caratula = ?, fuero = ?, juzgado = ?, numero = ?, cliente_id = ?, 
        lawyer_id = ?, estado = ?, notas = ?, contraparte_nombre = ?, 
        contraparte_abogado = ?, contraparte_contacto = ?, link_portal = ?, 
        ruta_carpeta = ?, jurisdiction_id = ?
      WHERE id = ?
    `).run(
      caratula.trim(),
      fuero?.trim() || 'Civil y Comercial',
      juzgado?.trim() || null,
      numero?.trim() || null,
      cliente_id,
      lawyer_id || null,
      estado || 'activo',
      notas?.trim() || null,
      contraparte_nombre?.trim() || null,
      contraparte_abogado?.trim() || null,
      contraparte_contacto?.trim() || null,
      link_portal?.trim() || null,
      ruta_carpeta?.trim() || null,
      jurisdiction_id || null,
      id
    );

    const updated = db.prepare(`
      SELECT c.*, cl.nombre AS cliente_nombre, l.nombre AS lawyer_nombre
      FROM cases c
      LEFT JOIN clients cl ON cl.id = c.cliente_id
      LEFT JOIN lawyers l ON l.id = c.lawyer_id
      WHERE c.id = ?
    `).get(id);

    return NextResponse.json({ case: updated });
  } catch (error: any) {
    console.error('Error updating case:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    // Eliminar movimientos y eventos asociados
    db.prepare('DELETE FROM movements WHERE case_id = ?').run(id);
    db.prepare('DELETE FROM agenda_events WHERE case_id = ?').run(id);
    db.prepare('DELETE FROM cases WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting case:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
