import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const record = await db.passwordResetToken.findUnique({ where: { token } });
    if (!record) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
    }
    if (record.expiresAt < new Date()) {
      await db.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: 'El enlace expiró. Pedí uno nuevo.' }, { status: 400 });
    }

    const hashed = await hash(password, 12);
    await db.user.update({ where: { email: record.email }, data: { password: hashed } });
    await db.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('reset-password error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
