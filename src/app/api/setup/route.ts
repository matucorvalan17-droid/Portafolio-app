import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

const SECRET = process.env.SETUP_SECRET ?? 'wealthtrack-setup-2024';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== SECRET) {
    return NextResponse.json({ error: 'Invalid or missing secret' }, { status: 403 });
  }

  try {
    const output = execSync('npx prisma db push --accept-data-loss', {
      env: { ...process.env },
      stdio: 'pipe',
    }).toString();

    return NextResponse.json({ success: true, message: 'Database tables created!', output });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.secret !== SECRET) {
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
