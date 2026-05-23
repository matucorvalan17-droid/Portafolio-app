import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, image } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (email && email !== session.user.email) {
      const exists = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (exists) {
        return NextResponse.json({ error: 'That email is already in use' }, { status: 409 });
      }
    }

    const updateData: { name: string; email?: string; image?: string } = {
      name: name.trim(),
    };
    if (email?.trim()) updateData.email = email.trim().toLowerCase();
    if (image !== undefined) updateData.image = image;

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, email: true, name: true, image: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('PUT /api/user/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
