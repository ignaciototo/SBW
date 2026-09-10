import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const activeCases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE estado = 'activo'").get() as { count: number };
    const totalClients = db.prepare("SELECT COUNT(*) as count FROM clients").get() as { count: number };
    const archivedCases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE estado = 'archivado'").get() as { count: number };
    
    // Vencimientos pendientes (estado != 'cumplido')
    const pendingEvents = db.prepare(`
      SELECT a.*, c.caratula, c.numero
      FROM agenda_events a
      LEFT JOIN cases c ON c.id = a.case_id
      WHERE a.estado != 'cumplido'
      ORDER BY a.fecha ASC
      LIMIT 5
    `).all();

    // Movimientos recientes
    const recentMovements = db.prepare(`
      SELECT m.*, c.caratula, c.numero
      FROM movements m
      JOIN cases c ON c.id = m.case_id
      ORDER BY m.created_at DESC
      LIMIT 6
    `).all();

    return NextResponse.json({
      stats: {
        activeCases: activeCases.count,
        totalClients: totalClients.count,
        archivedCases: archivedCases.count,
        pendingAlerts: pendingEvents.length
      },
      pendingEvents,
      recentMovements
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
