import { createClient } from '@supabase/supabase-js';

// יצירת לקוח Supabase עם פרטי ההתחברות האמיתיים
const supabaseUrl = 'https://nuepjimdxzybberqffds.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZXBqaW1keHp5YmJlcnFmZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5OTMyMTksImV4cCI6MjA2MTU2OTIxOX0.JI-XONtQgrTTJPdli01Ot84r1JwtYNSWodjflNzdwCU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('Supabase Integration Tests', () => {
  // נתונים לבדיקה
  const testRecordId = `test-${Date.now()}`;
  const testName = 'שם בדיקה';
  const testImagePath = 'test-image.jpg';

  // ניקוי אחרי הבדיקות
  afterAll(async () => {
    // מחיקת רשומות הבדיקה
    await supabase
      .from('fallen')
      .delete()
      .like('id', 'test-%');
  });

  it('connects to Supabase successfully', async () => {
    // בדיקת החיבור ל-Supabase
    const { data, error } = await supabase.from('fallen').select('count').limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('creates, retrieves, and updates a record in the fallen table', async () => {
    // יצירת רשומה חדשה
    const { error: insertError } = await supabase
      .from('fallen')
      .insert([
        {
          id: testRecordId,
          name: testName,
          image_path: testImagePath,
          approved: false
        }
      ]);
    
    expect(insertError).toBeNull();
    
    // קבלת הרשומה
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('fallen')
      .select('*')
      .eq('id', testRecordId)
      .single();
    
    expect(retrieveError).toBeNull();
    expect(retrievedData).toBeDefined();
    expect(retrievedData.name).toBe(testName);
    expect(retrievedData.image_path).toBe(testImagePath);
    expect(retrievedData.approved).toBe(false);
    
    // עדכון הרשומה
    const { error: updateError } = await supabase
      .from('fallen')
      .update({ approved: true })
      .eq('id', testRecordId);
    
    expect(updateError).toBeNull();
    
    // וידוא העדכון
    const { data: updatedData, error: updatedRetrieveError } = await supabase
      .from('fallen')
      .select('*')
      .eq('id', testRecordId)
      .single();
    
    expect(updatedRetrieveError).toBeNull();
    expect(updatedData.approved).toBe(true);
  });

  it('retrieves approved records only with RLS', async () => {
    // יצירת רשומות מאושרות ולא מאושרות
    const approvedId = `test-approved-${Date.now()}`;
    const unapprovedId = `test-unapproved-${Date.now()}`;
    
    // הוספת רשומה מאושרת
    await supabase
      .from('fallen')
      .insert([
        {
          id: approvedId,
          name: 'מאושר',
          image_path: 'approved.jpg',
          approved: true
        }
      ]);
    
    // הוספת רשומה לא מאושרת
    await supabase
      .from('fallen')
      .insert([
        {
          id: unapprovedId,
          name: 'לא מאושר',
          image_path: 'unapproved.jpg',
          approved: false
        }
      ]);
    
    // בדיקה שמשתמש אנונימי יכול לראות רק רשומות מאושרות
    const { data: anonData, error: anonError } = await supabase
      .from('fallen')
      .select('*')
      .in('id', [approvedId, unapprovedId]);
    
    expect(anonError).toBeNull();
    
    // וידוא שרק הרשומה המאושרת מוחזרת
    const hasApprovedOnly = anonData?.every(record => record.approved === true);
    expect(hasApprovedOnly).toBe(true);
    
    // וידוא שיש לפחות רשומה אחת 
    expect(anonData?.length).toBeGreaterThan(0);
  });
}); 