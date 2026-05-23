// WealthTrack — Transaction [id] API
// DELETE /api/transactions/:id → deletes a transaction owned by the logged-in user

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    // Verify the transaction exists and belongs to the current user
    const transaction = await db.transaction.findFirst({
      where: {
        id,
        portfolio: { userId: session.user.id },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    await db.transaction.delete({ where: { id } });

    return NextResponse.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('DELETE /api/transactions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
