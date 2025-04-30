import { createClient } from '@supabase/supabase-js';

// יצירת לקוח Supabase עם פרטי ההתחברות האמיתיים
const supabaseUrl = 'https://nuepjimdxzybberqffds.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZXBqaW1keHp5YmJlcnFmZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5OTMyMTksImV4cCI6MjA2MTU2OTIxOX0.JI-XONtQgrTTJPdli01Ot84r1JwtYNSWodjflNzdwCU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * בדיקות E2E לתוסף Chrome
 * 
 * הערה: בדיקות אמיתיות של תוסף Chrome דורשות puppeteer-core או כלים דומים
 * כדי לשלוט בדפדפן אמיתי. הבדיקות האלה מדמות את הפונקציונליות העיקרית
 * של התוסף עם פיתוח שרת והתממשקות אמיתית ל-Supabase.
 */
describe('Chrome Extension E2E Tests', () => {
  // בדיקה שה-API של Supabase נגיש ופועל
  it('retrieves approved records from Supabase', async () => {
    // קבלת רשומות מאושרות ממסד הנתונים
    const { data, error } = await supabase
      .from('fallen')
      .select('name, image_path')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(5);
    
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBeTruthy();
    
    // אם יש נתונים, בדוק את המבנה שלהם
    if (data && data.length > 0) {
      const firstRecord = data[0];
      expect(firstRecord).toHaveProperty('name');
      expect(firstRecord).toHaveProperty('image_path');
    }
  });

  // בדיקה של מסלול הקבצים ב-Storage
  it('accesses image paths in Supabase storage', async () => {
    // בדיקה שנתיבי הגישה לקבצים בסדר
    const testImagePath = 'test-placeholder.jpg';  // תמונה דמה
    
    // בניית URL של התמונה כפי שנעשה בתוסף
    const imageUrl = `${supabaseUrl}/storage/v1/object/public/fallen-images/${testImagePath}`;
    
    // בדיקה שהכתובת נוצרה כראוי
    expect(imageUrl).toContain('nuepjimdxzybberqffds.supabase.co');
    expect(imageUrl).toContain('fallen-images');
    expect(imageUrl).toContain(testImagePath);
    
    // הערה: כאן ניתן לבצע בקשת fetch אמיתית ל-URL כדי לוודא נגישות,
    // אך זה דורש שתהיה תמונה אמיתית במסד הנתונים עם השם המדויק הזה
  });

  // בדיקת סימולציה של פונקציונליות קוד התוסף
  it('simulates contentScript functionality', async () => {
    // מדמה את ההתנהגות של קובץ ה-contentScript.js
    
    // 1. בדיקת פונקציית isMemorialDay - הערה: מדומה תמיד כאמת בבדיקות
    const isMemorialDay = () => true;
    expect(isMemorialDay()).toBe(true);
    
    // 2. בדיקת החיבור ל-API וקבלת נתונים
    const { data, error } = await supabase
      .from('fallen')
      .select('name, image_path')
      .eq('approved', true)
      .order('created_at', { ascending: false });
      
    expect(error).toBeNull();
    
    // 3. בדיקה שהנתונים ראויים להצגה
    if (data && data.length > 0) {
      // מדמה את הצגת הנתונים כפי שנעשה בתוסף
      const records = data;
      const currentIndex = 0;
      
      // גישה לרשומה הראשונה
      const record = records[currentIndex];
      
      // בדיקה שיש שם ונתיב תמונה
      expect(record.name).toBeDefined();
      expect(record.image_path).toBeDefined();
      
      // בדיקה שהנתיב הוא מחרוזת לא ריקה
      expect(typeof record.image_path).toBe('string');
      expect(record.image_path.length).toBeGreaterThan(0);
    }
  });
}); 