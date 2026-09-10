import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    // Buscar en Causas
    const cases = db.prepare(`
      SELECT 'causa' as type, id, caratula as title, numero as subtitle 
      FROM cases 
      WHERE caratula LIKE ? OR numero LIKE ?
      LIMIT 5
    `).all(searchTerm, searchTerm);

    // Buscar en Clientes
    const clients = db.prepare(`
      SELECT 'cliente' as type, id, nombre as title, doc as subtitle 
      FROM clients 
      WHERE nombre LIKE ? OR doc LIKE ?
      LIMIT 5
    `).all(searchTerm, searchTerm);

    const results = [...cases, ...clients];

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error in search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
