import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        telegram_chat_id: {
          not: null,
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        telegram_chat_id: true,
        role: true,
      },
    });

    // Convert BigInt to string for JSON serialization
    const serializedUsers = users.map(user => ({
      ...user,
      telegram_chat_id: user.telegram_chat_id?.toString(),
      full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'کاربر بدون نام'
    }));

    return NextResponse.json({ 
      success: true, 
      count: serializedUsers.length, 
      users: serializedUsers 
    });
  } catch (error) {
    console.error('Error fetching telegram users:', error);
    return NextResponse.json({ error: 'Failed to fetch telegram users' }, { status: 500 });
  }
}
