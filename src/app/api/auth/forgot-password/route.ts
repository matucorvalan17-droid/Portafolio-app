import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

    const user = await db.user.findUnique({ where: { email } });
    // Always return success to avoid email enumeration
    if (!user) return NextResponse.json({ success: true });

    // Delete any existing tokens for this email
    await db.passwordResetToken.deleteMany({ where: { email } });

    const token     = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordResetToken.create({ data: { email, token, expiresAt } });

    const baseUrl   = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    await resend.emails.send({
      from:    'WealthTrack <noreply@wealthtrack.app>',
      to:      email,
      subject: 'Resetear contraseña — WealthTrack',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;color:#fff;padding:32px;border-radius:16px">
          <h2 style="margin:0 0 8px;font-size:22px">Resetear contraseña</h2>
          <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0 0 24px">
            Recibimos una solicitud para cambiar tu contraseña de WealthTrack.<br>
            El enlace expira en <strong style="color:#fff">1 hora</strong>.
          </p>
          <a href="${resetLink}"
             style="display:inline-block;background:#494fdf;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:15px;font-weight:600">
            Cambiar contraseña
          </a>
          <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:24px 0 0">
            Si no pediste esto, ignorá este correo. Tu contraseña no cambia.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('forgot-password error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
