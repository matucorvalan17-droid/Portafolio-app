import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { reconcileHolding } from '@/lib/holding-reconciler';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    const transaction = await db.transaction.findFirst({
      where: { id, portfolio: { userId: session.user.id } },
    });
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const { portfolioId, ticker } = transaction;

    await db.transaction.delete({ where: { id } });

    // Recalculate the holding from remaining transactions
    await reconcileHolding(portfolioId, ticker, db);

    return NextResponse.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('DELETE /api/transactions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
