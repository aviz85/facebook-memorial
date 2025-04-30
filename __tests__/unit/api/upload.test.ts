import { NextRequest } from 'next/server';
import { POST } from '@/app/api/upload/route';

// Mock for createClient
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null })
      }))
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null })
    })),
    rpc: jest.fn(() => ({
      data: true,
      error: null
    }))
  }))
}));

// Environment variables mock
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-url.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

describe('Upload API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle valid image upload', async () => {
    // Create mock request with FormData
    const formData = new FormData();
    formData.append('name', 'משה כהן');
    formData.append('file', new File(['test-image-content'], 'test.jpg', { type: 'image/jpeg' }));
    formData.append('connectionContext', 'קרוב משפחה');

    const headers = new Headers();
    headers.set('x-forwarded-for', '192.168.1.1');

    const mockRequest = new NextRequest('https://example.com/api/upload', {
      method: 'POST',
      body: formData,
      headers
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
  });

  it('should validate file size', async () => {
    // Create a large file (over 1MB)
    const largeFileContent = new Uint8Array(1.5 * 1024 * 1024); // 1.5MB
    const formData = new FormData();
    formData.append('name', 'משה כהן');
    formData.append('file', new File([largeFileContent], 'large.jpg', { type: 'image/jpeg' }));
    
    const mockRequest = new NextRequest('https://example.com/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    
    const responseData = await response.json();
    expect(responseData.error).toContain('גודל הקובץ חורג');
  });

  it('should validate file type', async () => {
    // Create a non-image file
    const formData = new FormData();
    formData.append('name', 'משה כהן');
    formData.append('file', new File(['document content'], 'document.pdf', { type: 'application/pdf' }));
    
    const mockRequest = new NextRequest('https://example.com/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    
    const responseData = await response.json();
    expect(responseData.error).toContain('יש להעלות קובץ תמונה בלבד');
  });

  it('should check required fields', async () => {
    // Missing required fields
    const formData = new FormData();
    // Not adding 'name' field
    formData.append('file', new File(['test-image-content'], 'test.jpg', { type: 'image/jpeg' }));
    
    const mockRequest = new NextRequest('https://example.com/api/upload', {
      method: 'POST',
      body: formData
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    
    const responseData = await response.json();
    expect(responseData.error).toContain('חסרים שדות חובה');
  });
}); 