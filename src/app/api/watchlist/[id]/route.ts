// WealthTrack — Watchlist Item API
// DELETE /api/watchlist/:id  → remove an item from the watchlist
// You don't need to edit this file.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const item = await db.watchlistItem.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.watchlistItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/watchlist/[id] error:', error);
    return NextResponse.json({ error: 'Failed to remove' }, { status: 500 });
  }
}
