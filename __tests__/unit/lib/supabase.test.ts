import '@testing-library/jest-dom';
import { getImageUrl } from '@/lib/supabase';

describe('Supabase Utility Functions', () => {
  describe('getImageUrl', () => {
    it('should return correct image URL', () => {
      const path = 'test-image.jpg';
      const expectedUrl = 'https://nuepjimdxzybberqffds.supabase.co/storage/v1/object/public/fallen-images/test-image.jpg';
      
      // Call the function
      const url = getImageUrl(path);
      
      // Verify the URL is constructed correctly
      expect(url).toBe(expectedUrl);
    });
  });
}); 