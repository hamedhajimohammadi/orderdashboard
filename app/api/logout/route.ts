import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Delete auth cookies
  cookieStore.delete('adminToken');
  cookieStore.delete('admin_name');
  
  return NextResponse.json({ success: true });
}
