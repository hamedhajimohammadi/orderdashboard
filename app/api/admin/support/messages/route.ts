import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
        return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
        where: { conversation_id: Number(conversationId) },
        orderBy: { created_at: 'asc' }
    });

    // Mark as read by ADMIN?
    // Maybe we should have a separate action for marking read.
    // For now, let's assume fetching them implies reading them or handle it in POST.
    
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
