import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import '@/lib/utils';

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: 'Order ID required' }, { status: 400 });

        let conversation = await prisma.conversation.findFirst({
            where: { order_id: Number(id) }
        });

        // Optionally create one if it doesn't exist? 
        // For admin viewing an order, we might interpret this as starting a chat if none exists.
        // But usually, we only create if User starts it OR Admin explicitly starts it.
        // Let's create it on the fly if admin wants to chat.
        
        if (!conversation) {
             const order = await prisma.order.findUnique({ where: { id: Number(id) }});
             if (order) {
                conversation = await prisma.conversation.create({
                    data: {
                        user_id: order.user_id,
                        order_id: Number(id),
                        status: 'OPEN' // Admin initiated
                    }
                });
             }
        }

        return NextResponse.json({ conversation });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
