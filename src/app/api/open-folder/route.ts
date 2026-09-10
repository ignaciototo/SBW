import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { join } from 'path';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let targetPath = searchParams.get('path');

    if (!targetPath) {
      return NextResponse.json({ error: 'Falta el parámetro path' }, { status: 400 });
    }

    // Si es una ruta relativa, la resolvemos desde el CWD (ej: storage\documents\4)
    if (!targetPath.includes(':\\') && !targetPath.startsWith('/')) {
      targetPath = join(process.cwd(), targetPath);
    }

    // Determinar el comando según el sistema operativo
    const isWin = process.platform === 'win32';
    const isMac = process.platform === 'darwin';

    let command = '';
    if (isWin) {
      // En Windows, explorer.exe abre la ruta
      command = `explorer.exe "${targetPath}"`;
    } else if (isMac) {
      command = `open "${targetPath}"`;
    } else {
      command = `xdg-open "${targetPath}"`;
    }

    // Ejecutar el comando para abrir la carpeta
    exec(command, (error) => {
      if (error) {
        console.error('Error abriendo carpeta:', error);
      }
    });

    return NextResponse.json({ success: true, opened: targetPath });
  } catch (error: any) {
    console.error('Error en open-folder:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
