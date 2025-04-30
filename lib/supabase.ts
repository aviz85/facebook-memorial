import { createClient } from '@supabase/supabase-js';

// Create a Supabase client using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our data
export type FallenRecord = {
  id: string;
  name: string;
  image_path: string;
  approved: boolean;
  uploader_id?: string;
  created_at: string;
};

// Function to get approved fallen records
export async function getApprovedFallenRecords() {
  const { data, error } = await supabase
    .from('fallen')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching fallen records:', error);
    throw error;
  }
  
  return data as FallenRecord[];
}

// Function to get pending fallen records (for admin use)
export async function getPendingFallenRecords() {
  const { data, error } = await supabase
    .from('fallen')
    .select('*')
    .eq('approved', false)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching pending records:', error);
    throw error;
  }
  
  return data as FallenRecord[];
}

// Function to approve a fallen record
export async function approveFallenRecord(id: string) {
  const { error } = await supabase
    .from('fallen')
    .update({ approved: true })
    .eq('id', id);
  
  if (error) {
    console.error('Error approving record:', error);
    throw error;
  }
  
  return true;
}

// Function to get image URL from path
export function getImageUrl(path: string) {
  return `${supabaseUrl}/storage/v1/object/public/fallen-images/${path}`;
} 