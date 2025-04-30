// ייבוא התרחבות Jest-DOM
import '@testing-library/jest-dom';

// הגדרת משתני סביבה לבדיקות
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://nuepjimdxzybberqffds.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZXBqaW1keHp5YmJlcnFmZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5OTMyMTksImV4cCI6MjA2MTU2OTIxOX0.JI-XONtQgrTTJPdli01Ot84r1JwtYNSWodjflNzdwCU';

// Mock global fetch
global.fetch = jest.fn();

// טיפול בשגיאות לא צפויות
beforeAll(() => {
  console.error = jest.fn((message) => {
    // הצגת השגיאות האמיתיות בלבד בלי הודעות מזויפות
    if (message.includes('Warning:')) {
      return;
    }
    console.log('[Test Error]:', message);
  });
  
  // חיקוי של localStorage עבור בדיקות
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  }
});

afterEach(() => {
  // ניקוי מוקים אחרי כל בדיקה
  jest.clearAllMocks();
});

// מוק לפונקציות של Chrome API עבור בדיקות תוסף
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
}; 