import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: NextRequest) {
  try {
    // יצירת לקוח Supabase עם הרשאות שרת
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // קבלת הנתונים מהבקשה
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const file = formData.get('file') as File;
    const connectionContext = formData.get('connectionContext') as string;
    
    if (!name || !file) {
      return NextResponse.json(
        { error: 'חסרים שדות חובה' },
        { status: 400 }
      );
    }
    
    // בדיקת גודל התמונה (מקסימום 1MB)
    if (file.size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'גודל הקובץ חורג מ-1 מגה-בייט' },
        { status: 400 }
      );
    }
    
    // בדיקת סוג הקובץ
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'יש להעלות קובץ תמונה בלבד' },
        { status: 400 }
      );
    }
    
    // יצירת שם קובץ ייחודי
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // העלאת התמונה לאחסון
    const { error: uploadError } = await supabase.storage
      .from('fallen-images')
      .upload(fileName, file, {
        contentType: file.type
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'שגיאה בהעלאת התמונה' },
        { status: 500 }
      );
    }
    
    // הוספת רשומה למסד הנתונים
    const { error: insertError } = await supabase
      .from('fallen')
      .insert([{ 
        name, 
        image_path: fileName,
        approved: false,
        connection_context: connectionContext
      }]);
    
    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'שגיאה בשמירת הפרטים' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת' },
      { status: 500 }
    );
  }
} 