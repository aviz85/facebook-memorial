import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubmitPage from '@/app/submit/page';
import { supabase } from '@/lib/supabase';
import userEvent from '@testing-library/user-event';

// מוק עבור פונקציית fetch
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  })
);

// מוק עבור FormData
global.FormData = jest.fn().mockImplementation(() => ({
  append: jest.fn()
}));

describe('SubmitPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the form correctly', () => {
    render(<SubmitPage />);
    expect(screen.getByText('טופס העלאת פרטי נופל/ת')).toBeInTheDocument();
    expect(screen.getByLabelText(/שם הנופל\/ת/i)).toBeInTheDocument();
    expect(screen.getByTestId('photo-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /שלח/i })).toBeInTheDocument();
  });
  
  it('validates file size', async () => {
    render(<SubmitPage />);
    
    // יצירת קובץ גדול
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    // העלאת הקובץ
    const fileInput = screen.getByTestId('photo-input');
    userEvent.upload(fileInput, largeFile);
    
    // בדיקת הודעת שגיאה
    await waitFor(() => {
      expect(screen.getByText(/גודל הקובץ חורג/i)).toBeInTheDocument();
    });
  });

  it('validates file type', async () => {
    render(<SubmitPage />);
    
    // יצירת קובץ שאינו תמונה
    const nonImageFile = new File(['document content'], 'document.pdf', { type: 'application/pdf' });
    
    // העלאת הקובץ
    const fileInput = screen.getByTestId('photo-input');
    userEvent.upload(fileInput, nonImageFile);
    
    // בדיקת הודעת שגיאה
    await waitFor(() => {
      expect(screen.getByText(/יש להעלות קובץ תמונה בלבד/i)).toBeInTheDocument();
    });
  });
  
  it('submits the form successfully', async () => {
    render(<SubmitPage />);
    
    // מילוי הטופס
    const nameInput = screen.getByLabelText(/שם הנופל\/ת/i);
    fireEvent.change(nameInput, { target: { value: 'משה כהן' } });
    
    const fileInput = screen.getByTestId('photo-input');
    const validFile = new File(['image content'], 'photo.jpg', { type: 'image/jpeg' });
    userEvent.upload(fileInput, validFile);
    
    const contextInput = screen.getByLabelText(/הקשר שיכול לסייע/i);
    fireEvent.change(contextInput, { target: { value: 'קרוב משפחה' } });
    
    // שליחת הטופס
    const submitButton = screen.getByRole('button', { name: /שלח/i });
    fireEvent.click(submitButton);
    
    // וידוא שהבקשה נשלחה
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/upload', expect.anything());
    });
  });
  
  it('shows error when submission fails', async () => {
    // הגדרת מוק של fetch שיחזיר שגיאה
    global.fetch = jest.fn().mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'שגיאת שרת' })
      })
    );
    
    render(<SubmitPage />);
    
    // מילוי הטופס
    const nameInput = screen.getByLabelText(/שם הנופל\/ת/i);
    fireEvent.change(nameInput, { target: { value: 'משה כהן' } });
    
    const fileInput = screen.getByTestId('photo-input');
    const validFile = new File(['image content'], 'photo.jpg', { type: 'image/jpeg' });
    userEvent.upload(fileInput, validFile);
    
    // שליחת הטופס
    const submitButton = screen.getByRole('button', { name: /שלח/i });
    fireEvent.click(submitButton);
    
    // וידוא שמוצגת הודעת שגיאה
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });
}); 