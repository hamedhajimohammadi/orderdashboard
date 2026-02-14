import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ 
    success: true, 
    data: {
      id: user.id,
      username: user.username,
      display_name: user.display_name || user.username,
      role: user.role
    } 
  });
}
