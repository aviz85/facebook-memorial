import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // Check if user is authenticated as admin
  const cookieStore = cookies();
  const adminCookie = cookieStore.get('admin-auth');
  
  if (!adminCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    // Fetch unapproved entries
    const { data, error } = await supabaseAdmin
      .from('fallen')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching pending entries:', error);
    return NextResponse.json({ error: 'Failed to fetch pending entries' }, { status: 500 });
  }
} 