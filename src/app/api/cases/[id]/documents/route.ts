import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const documents = db.prepare(`
      SELECT * FROM documents 
      WHERE case_id = ? 
      ORDER BY id DESC
    `).all(id);

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure the case-specific directory exists
    const caseDir = join(process.cwd(), 'storage', 'documents', id);
    if (!existsSync(caseDir)) {
      await mkdir(caseDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filenameInFolder = `${timestamp}-${safeFilename}`;
    const filePath = join(caseDir, filenameInFolder);

    await writeFile(filePath, buffer);

    const relativePath = `${id}/${filenameInFolder}`;

    const stmt = db.prepare(`
      INSERT INTO documents (case_id, nombre, tipo, fecha, ruta_archivo)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Determine type from extension or mime type
    let fileType = 'documento';
    if (file.type.includes('pdf')) fileType = 'pdf';
    else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) fileType = 'word';
    else if (file.type.includes('image')) fileType = 'imagen';

    const result = stmt.run(
      id,
      file.name,
      fileType,
      new Date().toISOString().split('T')[0],
      relativePath
    );

    const newDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ document: newDoc }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
