import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';

// ONE-TIME emergency password reset — DELETE THIS FILE AFTER USE
export async function GET() {
  try {
    const hashed = await hash('Mateo12@300', 12);
    await db.user.update({
      where: { email: 'mcorvalan1711@gmail.com' },
      data:  { password: hashed },
    });
    return NextResponse.json({ ok: true, msg: 'Contraseña reseteada. Ahora borrá esta ruta.' });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
