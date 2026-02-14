
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const margins = await prisma.categoryMargin.findMany({
      orderBy: { name: 'asc' }
    });
    
    // Serialize BigInt
    const safeMargins = JSON.parse(JSON.stringify(margins, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({ success: true, data: safeMargins });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { wc_id, margin_percent } = await req.json();
    
    const updated = await prisma.categoryMargin.update({
      where: { wc_id: BigInt(wc_id) },
      data: { margin_percent: parseFloat(margin_percent) }
    });

    const safeUpdated = JSON.parse(JSON.stringify(updated, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({ success: true, data: safeUpdated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
