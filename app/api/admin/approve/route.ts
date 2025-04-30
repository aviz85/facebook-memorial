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
  
  // Get the entry ID to approve from the request
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
    // Update the entry to approved
    const { error } = await supabaseAdmin
      .from('fallen')
      .update({ approved: true })
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving entry:', error);
    return NextResponse.json({ error: 'Failed to approve entry' }, { status: 500 });
  }
} 