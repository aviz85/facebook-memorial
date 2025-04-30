import { NextRequest } from 'next/server';
import { POST } from '@/app/api/upload/route';
import { createClient } from '@supabase/supabase-js';

// מוק ל-NextRequest ומודולים אחרים של Next.js
jest.mock('next/server', () => {
  return {
    NextRequest: jest.fn().mockImplementation((url, init) => ({
      url,
      formData: jest.fn().mockImplementation(() => init?.body || new FormData()),
      headers: {
        get: jest.fn((key) => init?.headers?.get(key) || null)
      }
    })),
    NextResponse: {
      json: jest.fn((body, init) => ({
        status: init?.status || 200,
        json: () => Promise.resolve(body)
      }))
    }
  };
});

// מוק ל-Supabase
jest.mock('@supabase/supabase-js', () => {
  const mockRpc = jest.fn();
  return {
    createClient: jest.fn(() => ({
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({ error: null })
        }))
      },
      from: jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ error: null })
      })),
      rpc: mockRpc
    })),
    mockRpc
  };
});

// מבייא את ה-API route שרוצים לבדוק
const { POST } = require('@/app/api/upload/route');

// משתני סביבה מוקיים
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-url.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

describe('Rate Limiting Tests', () => {
  let mockRpc;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc = require('@supabase/supabase-js').mockRpc;
  });

  it('should allow upload when rate limit is not reached', async () => {
    // הגדרת מוק שיחזיר true (המשתמש לא חרג ממגבלת ההעלאות)
    mockRpc.mockResolvedValueOnce({
      data: true,
      error: null
    });

    // יצירת FormData תקינה
    const formData = new FormData();
    formData.append('name', 'משה כהן');
    formData.append('file', new File(['image content'], 'test.jpg', { type: 'image/jpeg' }));

    // יצירת בקשה מוקית
    const mockRequest = {
      formData: jest.fn().mockResolvedValue(formData),
      headers: {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'x-forwarded-for') return '192.168.1.1';
          return null;
        })
      }
    };

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    
    // וידוא שהפונקציה check_submission_rate_limit נקראה עם הפרמטרים הנכונים
    expect(mockRpc).toHaveBeenCalledWith('check_submission_rate_limit', {
      ip: '192.168.1.1',
      limit_count: 5,
      cooldown_minutes: 60
    });
  });

  it('should reject upload when rate limit is reached', async () => {
    // הגדרת מוק שיחזיר false (המשתמש חרג ממגבלת ההעלאות)
    mockRpc.mockResolvedValueOnce({
      data: false,
      error: null
    });

    // יצירת FormData תקינה
    const formData = new FormData();
    formData.append('name', 'משה כהן');
    formData.append('file', new File(['image content'], 'test.jpg', { type: 'image/jpeg' }));

    // יצירת בקשה מוקית
    const mockRequest = {
      formData: jest.fn().mockResolvedValue(formData),
      headers: {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'x-forwarded-for') return '192.168.1.1';
          return null;
        })
      }
    };

    const response = await POST(mockRequest);
    expect(response.status).toBe(429); // Too Many Requests
    
    const responseData = await response.json();
    expect(responseData.error).toContain('הגעת למגבלת ההעלאות');
  });

  it('should use x-real-ip header if x-forwarded-for is not available', async () => {
    // הגדרת מוק שיחזיר true
    mockRpc.mockResolvedValueOnce({
      data: true,
      error: null
    });

    // יצירת FormData תקינה
    const formData = new FormData();
    formData.append('name', 'משה כהן');
    formData.append('file', new File(['image content'], 'test.jpg', { type: 'image/jpeg' }));

    // יצירת בקשה מוקית
    const mockRequest = {
      formData: jest.fn().mockResolvedValue(formData),
      headers: {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'x-real-ip') return '10.0.0.1';
          return null;
        })
      }
    };

    await POST(mockRequest);
    
    // וידוא שהפונקציה check_submission_rate_limit נקראה עם ה-IP הנכון
    expect(mockRpc).toHaveBeenCalledWith('check_submission_rate_limit', {
      ip: '10.0.0.1',
      limit_count: 5,
      cooldown_minutes: 60
    });
  });

  it('should use "unknown" as IP if no headers are available', async () => {
    // הגדרת מוק שיחזיר true
    mockRpc.mockResolvedValueOnce({
      data: true,
      error: null
    });

    // יצירת FormData תקינה
    const formData = new FormData();
    formData.append('name', 'משה כהן');
    formData.append('file', new File(['image content'], 'test.jpg', { type: 'image/jpeg' }));

    // יצירת בקשה מוקית
    const mockRequest = {
      formData: jest.fn().mockResolvedValue(formData),
      headers: {
        get: jest.fn().mockImplementation(() => null)
      }
    };

    await POST(mockRequest);
    
    // וידוא שהפונקציה check_submission_rate_limit נקראה עם "unknown"
    expect(mockRpc).toHaveBeenCalledWith('check_submission_rate_limit', {
      ip: 'unknown',
      limit_count: 5,
      cooldown_minutes: 60
    });
  });
}); 