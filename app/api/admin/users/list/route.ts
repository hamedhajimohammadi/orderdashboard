import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'administrator') {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Just fetch admins
        const users = await prisma.user.findMany({
            where: { role: 'administrator' },
            select: { id: true, first_name: true, last_name: true, display_name: true, role: true }
        });
        
        return NextResponse.json({ users });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
