import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
        return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: Number(conversationId) },
      include: { 
        assignee: {
           select: { id: true, display_name: true, first_name: true, last_name: true }
        } 
      }
    });

    const messages = await prisma.message.findMany({
        where: { conversation_id: Number(conversationId) },
        orderBy: { created_at: 'asc' }
    });

    return NextResponse.json({ messages, conversation });
  } catch (error) {
    console.error('Fetch Messages Error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
