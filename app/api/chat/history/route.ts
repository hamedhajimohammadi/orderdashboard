import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ensure this utility exists and exports prisma instance

export const dynamic = 'force-dynamic';

function setCorsHeaders(res: NextResponse) {
  // Allow all origins for dev simplicity or specific origin
  res.headers.set('Access-Control-Allow-Origin', '*'); 
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const guestToken = searchParams.get('guestToken');
    const userId = searchParams.get('userId');

    if (!guestToken && !userId) {
      return setCorsHeaders(NextResponse.json({ error: 'Identity required' }, { status: 400 }));
    }

    // Determine user identity
    const whereClause: any = userId 
      ? { user_id: parseInt(userId) } 
      : { guest_token: guestToken };

    // Fetch all conversations for this user, ordered by most recent
    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        messages: {
          orderBy: { created_at: 'asc' }
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    // If no conversation found, return empty array or specific structure
    // Usually the frontend expects a single active chat or list.
    // Let's return the most relevant (active) or all.
    // If the frontend is simple, it might just want messages of the latest conversation.
    
    // For now, let's return the full list of conversations with messages
    return setCorsHeaders(NextResponse.json({ conversations }));

  } catch (error) {
    console.error('Chat History Error:', error);
    return setCorsHeaders(NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }));
  }
}
