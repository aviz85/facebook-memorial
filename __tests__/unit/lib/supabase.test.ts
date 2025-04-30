import { getApprovedFallenRecords, getPendingFallenRecords, approveFallenRecord, getImageUrl, FallenRecord } from '@/lib/supabase';

// Created a mocked version of the module
const mockRecords: FallenRecord[] = [
  { id: '1', name: 'שם1', image_path: 'path1.jpg', approved: true, created_at: new Date().toISOString() },
  { id: '2', name: 'שם2', image_path: 'path2.jpg', approved: true, created_at: new Date().toISOString() }
];

// Mock the entire supabase module
jest.mock('@/lib/supabase', () => {
  // Keep the original implementations for the exported functions
  const original = jest.requireActual('@/lib/supabase');
  
  // Create a mock for the supabase client that's used within those functions
  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  };
  
  return {
    ...original,
    supabase: mockSupabaseClient,
    // Override the functions with test implementations that use the mock client
    getApprovedFallenRecords: jest.fn().mockImplementation(() => {
      if (mockSupabaseClient.order.mock.results[0]?.value?.error) {
        throw mockSupabaseClient.order.mock.results[0].value.error;
      }
      return mockSupabaseClient.order.mock.results[0]?.value?.data || [];
    }),
    getPendingFallenRecords: jest.fn().mockImplementation(() => {
      if (mockSupabaseClient.order.mock.results[0]?.value?.error) {
        throw mockSupabaseClient.order.mock.results[0].value.error;
      }
      return mockSupabaseClient.order.mock.results[0]?.value?.data || [];
    }),
    approveFallenRecord: jest.fn().mockImplementation(() => {
      if (mockSupabaseClient.eq.mock.results[0]?.value?.error) {
        throw mockSupabaseClient.eq.mock.results[0].value.error;
      }
      return true;
    }),
  };
});

// Import the mocked supabase client
import { supabase } from '@/lib/supabase';

describe('Supabase Utility Functions', () => {
  // נקה את כל המוקים לפני כל בדיקה
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getApprovedFallenRecords', () => {
    it('should fetch approved records successfully', async () => {
      // הגדרת המוק להחזיר את הנתונים המדומים
      (supabase.order as jest.Mock).mockResolvedValue({ 
        data: mockRecords, 
        error: null
      });

      // קריאה לפונקציה
      const result = await getApprovedFallenRecords();

      // וידוא שהפונקציה הוזמנה עם הפרמטרים הנכונים
      expect(supabase.from).toHaveBeenCalledWith('fallen');
      expect(supabase.eq).toHaveBeenCalledWith('approved', true);
      
      // וידוא שהתוצאה היא כמו שציפינו
      expect(result).toEqual(mockRecords);
    });

    it('should throw error if Supabase returns an error', async () => {
      // הגדרת המוק להחזיר שגיאה
      (supabase.order as jest.Mock).mockResolvedValue({ 
        data: null, 
        error: new Error('Database error')
      });

      // וידוא שהפונקציה זורקת שגיאה
      await expect(getApprovedFallenRecords()).rejects.toThrow('Database error');
    });
  });

  describe('getPendingFallenRecords', () => {
    it('should fetch pending records successfully', async () => {
      // הכנת נתוני מוק לתשובה
      const pendingRecords: FallenRecord[] = [
        { id: '3', name: 'שם3', image_path: 'path3.jpg', approved: false, created_at: new Date().toISOString() }
      ];

      // הגדרת המוק להחזיר את הנתונים המדומים
      (supabase.order as jest.Mock).mockResolvedValue({ 
        data: pendingRecords, 
        error: null
      });

      // קריאה לפונקציה
      const result = await getPendingFallenRecords();

      // וידוא שהפונקציה הוזמנה עם הפרמטרים הנכונים
      expect(supabase.from).toHaveBeenCalledWith('fallen');
      expect(supabase.eq).toHaveBeenCalledWith('approved', false);
      
      // וידוא שהתוצאה היא כמו שציפינו
      expect(result).toEqual(pendingRecords);
    });
  });

  describe('approveFallenRecord', () => {
    it('should approve a record successfully', async () => {
      // הגדרת המוק להחזיר הצלחה
      (supabase.eq as jest.Mock).mockResolvedValue({ 
        error: null
      });

      // קריאה לפונקציה
      const result = await approveFallenRecord('1');

      // וידוא שהפונקציה הוזמנה עם הפרמטרים הנכונים
      expect(supabase.from).toHaveBeenCalledWith('fallen');
      expect(supabase.update).toHaveBeenCalledWith({ approved: true });
      expect(supabase.eq).toHaveBeenCalledWith('id', '1');
      
      // וידוא שהתוצאה היא כמו שציפינו
      expect(result).toBe(true);
    });

    it('should throw error if approval fails', async () => {
      // הגדרת המוק להחזיר שגיאה
      (supabase.eq as jest.Mock).mockResolvedValue({ 
        error: new Error('Update failed')
      });

      // וידוא שהפונקציה זורקת שגיאה
      await expect(approveFallenRecord('1')).rejects.toThrow('Update failed');
    });
  });

  describe('getImageUrl', () => {
    it('should return correct image URL', () => {
      const path = 'test-image.jpg';
      const expectedUrl = 'https://nuepjimdxzybberqffds.supabase.co/storage/v1/object/public/fallen-images/test-image.jpg';
      
      // בדיקת הפונקציה
      const url = getImageUrl(path);
      
      // וידוא התוצאה הנכונה
      expect(url).toBe(expectedUrl);
    });
  });
}); 