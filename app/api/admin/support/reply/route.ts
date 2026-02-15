import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { conversationId, content } = body;

        if (!conversationId || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }
        
        const message = await prisma.message.create({
            data: {
                conversation_id: Number(conversationId),
                sender: 'ADMIN',
                content: content,
                is_read: false // User hasn't read it yet
            }
        });

        // Update conversation status to OPEN (meaning waiting for user reply, or processed)
        await prisma.conversation.update({
            where: { id: Number(conversationId) },
            data: { 
                status: 'OPEN', 
                updated_at: new Date()
            }
        });
        
        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error('Reply Error:', error);
        return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
    }
}
