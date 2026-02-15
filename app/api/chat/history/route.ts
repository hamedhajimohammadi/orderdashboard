import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function setCorsHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*'); 
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 200 });
  return setCorsHeaders(res);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const guestToken = searchParams.get('guestToken');
    const orderId = searchParams.get('orderId');

    if (!userId && !guestToken && !orderId) {
       const res = NextResponse.json({ error: 'Identity (userId, guestToken) or orderId is required' }, { status: 400 });
       return setCorsHeaders(res);
    }

    const whereClause: any = {};

    if (userId) {
        whereClause.user_id = Number(userId);
    } else if (guestToken) {
        whereClause.guest_token = guestToken;
    }
    
    // If orderId is provided, add it to the filter
    if (orderId) {
        whereClause.order_id = Number(orderId);
    }

    // Fetch conversation(s) with messages
    const conversations = await prisma.conversation.findMany({
        where: whereClause,
        include: {
            messages: {
                orderBy: {
                    created_at: 'asc'
                }
            }
        },
        orderBy: {
            updated_at: 'desc'
        }
    });

    const res = NextResponse.json({ success: true, conversations });
    return setCorsHeaders(res);

  } catch (error) {
    console.error('Chat History Error:', error);
    const res = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    return setCorsHeaders(res);
  }
}
