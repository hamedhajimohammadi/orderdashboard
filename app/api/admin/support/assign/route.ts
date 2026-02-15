import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'administrator') {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { conversationId, assigneeId } = body; // assigneeId can be null (unassign) or number

        if (!conversationId) {
             return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
        }

        const conversation = await prisma.conversation.findUnique({ 
            where: { id: conversationId },
            include: { assignee: true }
        });
        
        if (!conversation) {
             return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Logic check: Is it already assigned to someone else?
        // If assigned to someone else, and I am not forcing a transfer, maybe warn?
        // For now, allow overwrite.

        const updated = await prisma.conversation.update({
            where: { id: conversationId },
            data: { assignee_id: assigneeId }
        });

        // Log the action as a message
        let statusText = '';
        if (assigneeId === user.id) {
            statusText = `گفتگو توسط ${user.display_name || user.username} برداشته شد.`;
        } else if (assigneeId) {
             // We need to fetch the target admin name for better logs, but simple is ok for now.
             statusText = `گفتگو به ادمین دیگر ارجاع شد.`;
        } else {
             statusText = `گفتگو آزاد شد (بدون مسئول).`;
        }

        await prisma.message.create({
            data: {
                conversation_id: conversationId,
                sender: 'SYSTEM',
                content: statusText,
                is_read: true
            }
        });

        return NextResponse.json({ success: true, conversation: updated });

    } catch (e) {
        console.error('Assign Error:', e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
