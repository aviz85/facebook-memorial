import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Check if user is authenticated as admin
  const cookieStore = cookies();
  const adminCookie = cookieStore.get('admin_auth');
  
  if (!adminCookie || adminCookie.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get filter parameter (default to 'pending')
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'pending';
  
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
    let query = supabaseAdmin.from('fallen').select('*');
    
    // Apply filtering based on parameter
    if (filter === 'pending') {
      // Not approved and not rejected
      query = query.eq('approved', false).eq('rejected', false);
    } else if (filter === 'rejected') {
      // Only rejected entries
      query = query.eq('rejected', true);
    } else if (filter === 'approved') {
      // Only approved entries
      query = query.eq('approved', true);
    }
    // 'all' filter doesn't add any conditions
    
    // Always sort by newest first
    const { data, error } = await query.order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
} 