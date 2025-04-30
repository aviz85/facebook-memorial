import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  // Check if user is authenticated as admin
  const cookieStore = cookies();
  const adminCookie = cookieStore.get('admin_auth');
  
  if (!adminCookie || adminCookie.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get the entry ID to reject from the request
  const data = await request.json();
  const { id } = data;
  
  if (!id) {
    return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 });
  }
  
  // Use service role to bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      }
    }
  );
  
  try {
    // Update the entry to rejected
    const { error } = await supabaseAdmin
      .from('fallen')
      .update({ rejected: true, approved: false })
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting entry:', error);
    return NextResponse.json({ error: 'Failed to reject entry' }, { status: 500 });
  }
} 