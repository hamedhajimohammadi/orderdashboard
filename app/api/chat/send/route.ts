import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function setCorsHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', 'https://pgemshop.com');
  // Allow localhost for testing if needed, or make it dynamic based on origin
  // but prompt specifically mentioned pgemshop.com
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
    const searchConditions: any = {
        OR: [
            { status: 'OPEN' },
            { status: 'WAITING_FOR_ADMIN' }
        ]
    };

    if (userId) {
        searchConditions.user_id = Number(userId);
    } else {
        searchConditions.guest_token = guestToken;
    }

    let conversation = await prisma.conversation.findFirst({
        where: searchConditions,
        orderBy: { updated_at: 'desc' }
    });

    if (!conversation) {
        // Create new conversation
        conversation = await prisma.conversation.create({
            data: {
                user_id: userId ? Number(userId) : null,
                guest_token: userId ? null : guestToken,
                order_id: orderId ? Number(orderId) : null,
                status: 'OPEN'
            }
        });
    } else {
        // If orderId is provided specifically now, we might want to update the conversation
        // providing it's not already linked to another order?
        if (orderId && !conversation.order_id) {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { order_id: Number(orderId) }
            });
        }
    }

    const message = await prisma.message.create({
        data: {
            conversation_id: conversation.id,
            sender: sender || 'USER',
            content: content
        }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
        where: { id: conversation.id },
        data: { 
            updated_at: new Date(),
            // If user sent message, ensure status is OPEN or WAITING_FOR_ADMIN?
            // "status" defaults to OPEN.
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
