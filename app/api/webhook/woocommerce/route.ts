import { NextResponse } from 'next/server';
import { syncOrderWithWooCommerce } from '@/lib/sync-helper';

export async function POST(req: Request) {
  try {
    const textBody = await req.text();
    if (textBody.startsWith('webhook_id=')) return NextResponse.json({ ok: true });
    if (!textBody) return NextResponse.json({ error: 'Empty' }, { status: 400 });

    const order = JSON.parse(textBody);

    await syncOrderWithWooCommerce(order);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
