import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
        orderBy: { updated_at: 'desc' },
        include: {
            messages: {
                take: 1,
                orderBy: { created_at: 'desc' }
            },
            order: {
                select: {
                    id: true,
                    wp_order_id: true,
                    status: true,
                    total_amount_gross: true
                }
            }
        }
    });
    
    // Add logic to determine "unread" status if needed
    // The prompt says "List of active chats (those with new messages or WAITING_FOR_ADMIN be bold)".
    
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Fetch Conversations Error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
