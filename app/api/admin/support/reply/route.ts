import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { conversationId, content } = await req.json();

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

        await prisma.conversation.update({
            where: { id: Number(conversationId) },
            data: { 
                status: 'OPEN', // Or 'ANSWERED'
                updated_at: new Date()
            }
        });
        
        return NextResponse.json({ success: true, message });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
    }
}
