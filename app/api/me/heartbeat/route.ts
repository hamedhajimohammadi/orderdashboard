import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
    try {
        const user = await getCurrentUser();
        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: { last_seen: new Date() } // Update last_seen
            });
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false }, { status: 401 });
    } catch (e) {
        return NextResponse.json({ success: false });
    }
}
