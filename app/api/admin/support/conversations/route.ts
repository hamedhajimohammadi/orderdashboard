import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import '@/lib/utils'; // Patch BigInt JSON serialization

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
        orderBy: { updated_at: 'desc' },
        include: {
            user: {
                select: {
                    id: true,
                    first_name: true, 
                    last_name: true,
                    last_seen: true
                }
            },
            assignee: {
                select: {
                    id: true,
                    display_name: true,
                    first_name: true,
                    last_name: true
                }
            },
            messages: {
                take: 1,
                orderBy: { created_at: 'desc' },
                select: {
                    content: true,
                    created_at: true,
                    sender: true,
                    is_read: true 
                }
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

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Fetch Conversations Error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
