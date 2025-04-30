import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubmitPage from '@/app/submit/page';
import { supabase } from '@/lib/supabase';
import userEvent from '@testing-library/user-event';

// Mock for Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null })
      }))
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null })
    }))
  }
}));

// Mock for UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid')
}));

describe('SubmitPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the form correctly', () => {
    render(<SubmitPage />);
    expect(screen.getByText('טופס העלאת פרטי נופל/ת')).toBeInTheDocument();
    expect(screen.getByLabelText(/שם הנופל\/ת/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/תמונה/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /שלח/i })).toBeInTheDocument();
  });
  
  it('validates file size', async () => {
    render(<SubmitPage />);
    
    // Create a large file
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    // Upload the file
    const fileInput = screen.getByLabelText(/תמונה/i);
    userEvent.upload(fileInput, largeFile);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/גודל הקובץ חורג/i)).toBeInTheDocument();
    });
  });
}); 