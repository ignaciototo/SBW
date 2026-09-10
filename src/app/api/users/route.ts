import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const users = db.prepare('SELECT id, username, role, is_active, created_at FROM users ORDER BY username ASC').all();
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, role } = body;

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Usuario, contraseña y rol son obligatorios' }, { status: 400 });
    }

    // Check if username exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return NextResponse.json({ error: 'El nombre de usuario ya está en uso' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, role, is_active)
      VALUES (?, ?, ?, 1)
    `);

    const result = stmt.run(username.trim(), hash, role);
    const newUser = db.prepare('SELECT id, username, role, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, username, password, role, is_active } = body;

    if (!id || !username || !role) {
      return NextResponse.json({ error: 'ID, usuario y rol son requeridos' }, { status: 400 });
    }

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      db.prepare('UPDATE users SET username = ?, password_hash = ?, role = ?, is_active = ? WHERE id = ?').run(
        username.trim(), hash, role, is_active ? 1 : 0, id
      );
    } else {
      db.prepare('UPDATE users SET username = ?, role = ?, is_active = ? WHERE id = ?').run(
        username.trim(), role, is_active ? 1 : 0, id
      );
    }

    const updated = db.prepare('SELECT id, username, role, is_active, created_at FROM users WHERE id = ?').get(id);
    return NextResponse.json({ user: updated });
  } catch (error: any) {
    console.error('Error updating user:', error);
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

    // Prevenir borrar el único admin
    const adminsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'abogado' AND is_active = 1").get() as { count: number };
    const userToDelete = db.prepare("SELECT role FROM users WHERE id = ?").get(id) as any;
    
    if (userToDelete?.role === 'abogado' && adminsCount.count <= 1) {
      return NextResponse.json({ error: 'No se puede eliminar al último abogado/administrador del sistema' }, { status: 400 });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
