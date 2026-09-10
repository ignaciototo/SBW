import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string, docId: string }> }
) {
  try {
    const { id, docId } = await params;

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId) as any;
    
    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    let filePath = join(process.cwd(), 'storage', 'documents', doc.ruta_archivo);
    
    if (!existsSync(filePath)) {
      const fallbackPath = join(process.cwd(), 'storage', 'documents', id, doc.ruta_archivo);
      if (existsSync(fallbackPath)) {
        filePath = fallbackPath;
      } else {
        return NextResponse.json({ error: 'El archivo físico no existe' }, { status: 404 });
      }
    }

    const fileBuffer = await readFile(filePath);
    
    // Determine content type
    let contentType = 'application/octet-stream';
    if (doc.tipo === 'pdf') contentType = 'application/pdf';
    else if (doc.tipo === 'word') contentType = 'application/msword';
    else if (doc.tipo === 'imagen' && doc.nombre.toLowerCase().endsWith('.png')) contentType = 'image/png';
    else if (doc.tipo === 'imagen' && (doc.nombre.toLowerCase().endsWith('.jpg') || doc.nombre.toLowerCase().endsWith('.jpeg'))) contentType = 'image/jpeg';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${doc.nombre}"`,
      },
    });
  } catch (error: any) {
    console.error('Error fetching document file:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string, docId: string }> }
) {
  try {
    const { id, docId } = await params;

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId) as any;
    
    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Delete file from disk
    let filePath = join(process.cwd(), 'storage', 'documents', doc.ruta_archivo);
    if (!existsSync(filePath)) {
      const fallbackPath = join(process.cwd(), 'storage', 'documents', id, doc.ruta_archivo);
      if (existsSync(fallbackPath)) {
        filePath = fallbackPath;
      }
    }
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Delete record from database
    db.prepare('DELETE FROM documents WHERE id = ?').run(docId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
