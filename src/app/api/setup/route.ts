import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
  const secret = process.env.SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'SETUP_SECRET not configured' }, { status: 403 });
  }
  return NextResponse.json({ message: 'Use POST with { "secret": "..." }' });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const secret = process.env.SETUP_SECRET ?? 'wealthtrack-setup-2024';

    if (body.secret !== secret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
    }

    execSync('npx prisma db push --accept-data-loss', {
      env: { ...process.env },
      stdio: 'pipe',
    });

    return NextResponse.json({ success: true, message: 'Database tables created successfully!' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
