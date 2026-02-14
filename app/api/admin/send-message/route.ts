
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, message } = await req.json();

    if (!orderId || !message) {
      return NextResponse.json({ message: 'Missing orderId or message' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { user: true }
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (!order.user?.telegram_chat_id) {
      return NextResponse.json({ message: 'User does not have a Telegram Chat ID' }, { status: 400 });
    }

    const result = await sendTelegramMessage(order.user.telegram_chat_id, message);

    if (result && result.ok) {
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ success: false, message: 'Failed to send message' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Send Message Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
