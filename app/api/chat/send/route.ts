import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function setCorsHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*'); // Allow all origins for now to avoid CORS issues during dev/testing
  res.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 200 });
  return setCorsHeaders(res);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, guestToken, userId, orderId, sender } = body; 

    if (!content) {
       const res = NextResponse.json({ error: 'Content is required' }, { status: 400 });
       return setCorsHeaders(res);
    }

    if (!guestToken && !userId) {
        const res = NextResponse.json({ error: 'Identity (guestToken or userId) is required' }, { status: 400 });
        return setCorsHeaders(res);
    }

    // Search criteria logic for OPEN conversation
    const statusFilter = {
        in: ['OPEN', 'WAITING_FOR_ADMIN']
    };

    const whereClause: any = {
        status: statusFilter
    };

    if (userId) {
        whereClause.user_id = Number(userId);
    } else if (guestToken) {
        whereClause.guest_token = guestToken;
    }

    // If orderId is provided, we prefer a conversation linked to that order if it exists and is open
    if (orderId) {
        // We can try to find by order_id specifically first
        const orderConversation = await prisma.conversation.findFirst({
            where: {
                order_id: Number(orderId),
                status: statusFilter
            }
        });
        if (orderConversation) {
            // Found one linked to order
             var conversation = orderConversation;
        }
    }

    // If not found by order_id (or orderId not provided), search by user/guest
    if (typeof conversation === 'undefined' || !conversation) {
        var conversation = await prisma.conversation.findFirst({
            where: whereClause,
            orderBy: { updated_at: 'desc' }
        });
    }

    if (!conversation) {
        // Create new conversation
        conversation = await prisma.conversation.create({
            data: {
                user_id: userId ? Number(userId) : null,
                guest_token: userId ? null : guestToken,
                order_id: orderId ? Number(orderId) : null,
                status: 'AI_HANDLING' // Start with AI handling by default for new chats
            }
        });
    } else {
        // If orderId is provided specifically now, and conversation not linked, update it?
        // Or if the conversation was found by user/guest but not linked to this order?
        if (orderId && !conversation.order_id) {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { order_id: Number(orderId) }
            });
        }
        
        // Update status to WAITING_FOR_ADMIN since user sent a message (if not already AI or specific flow)
        // Note: For now we default to WAITING_FOR_ADMIN if user speaks. 
        // If we want AI to reply, we might keep it as AI_HANDLING and have a separate background job.
        if (conversation.status !== 'WAITING_FOR_ADMIN' && conversation.status !== 'AI_HANDLING') {
             await prisma.conversation.update({
                where: { id: conversation.id },
                data: { status: 'WAITING_FOR_ADMIN' }
            });
        }
    }

    const message = await prisma.message.create({
        data: {
            conversation_id: conversation.id,
            sender: sender || 'USER',
            content: content,
            is_read: false
        }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
        where: { id: conversation.id },
        data: { 
            updated_at: new Date()
        }
    });

    const res = NextResponse.json({ success: true, message, conversationId: conversation.id });
    return setCorsHeaders(res);

  } catch (error) {
    console.error('Chat Send Error:', error);
    const res = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    return setCorsHeaders(res);
  }
}
