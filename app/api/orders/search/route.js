import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const jsonWithBigInt = (data) => {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint'
      ? value.toString()
      : value
  ));
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const skip = (page - 1) * limit;

  try {
    console.log(`🔍 Searching in DB: ${query}`);

    const isNumeric = /^\d+$/.test(query);
    
    const whereCondition = {
      OR: [
        { order_title: { contains: query, mode: 'insensitive' } },
        { operator_name: { contains: query, mode: 'insensitive' } },
        { user: { first_name: { contains: query, mode: 'insensitive' } } },
        { user: { last_name: { contains: query, mode: 'insensitive' } } },
        // If numeric, try to match wp_order_id
        ...(isNumeric ? [{ wp_order_id: BigInt(query) }] : []),
      ]
    };

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereCondition,
        take: limit,
        skip: skip,
        orderBy: {
          order_date: 'desc', // Sort by creation date as requested ("last order that came in")
        },
        include: {
          user: true,
        },
      }),
      prisma.order.count({ where: whereCondition })
    ]);

    return NextResponse.json({
      success: true,
      data: jsonWithBigInt(orders),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount
      }
    });

  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ success: false, data: [], pagination: { currentPage: 1, totalPages: 1 } }, { status: 500 });
  }
}
