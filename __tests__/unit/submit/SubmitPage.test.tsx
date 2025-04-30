import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubmitPage from '@/app/submit/page';
import { supabase } from '@/lib/supabase';
import userEvent from '@testing-library/user-event';

// מוק לקוד של Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
      }),
    },
    from: jest.fn().mockReturnValue({
      insert: jest.fn(),
    }),
  },
}));

// מוק לספריית UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

describe('SubmitPage', () => {
  // הגדרת המוק לפני כל בדיקה
  beforeEach(() => {
    // איפוס המוקים
    jest.clearAllMocks();
    
    // הגדרת תשובות ברירת מחדל
    (supabase.storage.from().upload as jest.Mock).mockResolvedValue({ error: null });
    (supabase.from().insert as jest.Mock).mockResolvedValue({ error: null });
  });

  it('renders the form correctly', () => {
    render(<SubmitPage />);
    
    // בדיקה שהכותרת מוצגת
    expect(screen.getByText('טופס העלאת פרטי נופל/ת')).toBeInTheDocument();
    
    // בדיקה שהשדות מוצגים
    expect(screen.getByLabelText(/שם הנופל\/ת/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/תמונה/i)).toBeInTheDocument();
    
    // בדיקה שכפתור השליחה מוצג
    expect(screen.getByRole('button', { name: /שלח/i })).toBeInTheDocument();
  });

  it('validates form fields', async () => {
    render(<SubmitPage />);
    
    // אירוע לחיצה על כפתור שליחה ללא מילוי שדות
    fireEvent.click(screen.getByRole('button', { name: /שלח/i }));
    
    // המתנה להופעת הודעת שגיאה
    await waitFor(() => {
      expect(screen.getByText(/יש להזין את שם הנופל\/ת/i)).toBeInTheDocument();
    });
    
    // מילוי השם ולחיצה שנית
    fireEvent.change(screen.getByLabelText(/שם הנופל\/ת/i), { target: { value: 'שם לדוגמה' } });
    fireEvent.click(screen.getByRole('button', { name: /שלח/i }));
    
    // המתנה להופעת הודעת שגיאה על התמונה החסרה
    await waitFor(() => {
      expect(screen.getByText(/יש לבחור תמונה/i)).toBeInTheDocument();
    });
  });

  it('validates file size', async () => {
    render(<SubmitPage />);
    
    // יצירת קובץ גדול מדי (2MB)
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    // העלאת הקובץ
    const fileInput = screen.getByLabelText(/תמונה/i);
    userEvent.upload(fileInput, largeFile);
    
    // המתנה להופעת הודעת שגיאה
    await waitFor(() => {
      expect(screen.getByText(/גודל הקובץ חורג מ-1 מגה-בייט/i)).toBeInTheDocument();
    });
  });

  it('validates file type', async () => {
    render(<SubmitPage />);
    
    // יצירת קובץ מסוג לא נתמך
    const invalidFile = new File(['content'], 'document.txt', { type: 'text/plain' });
    
    // העלאת הקובץ
    const fileInput = screen.getByLabelText(/תמונה/i);
    userEvent.upload(fileInput, invalidFile);
    
    // המתנה להופעת הודעת שגיאה
    await waitFor(() => {
      expect(screen.getByText(/יש להעלות קובץ תמונה בלבד/i)).toBeInTheDocument();
    });
  });

  it('submits the form successfully', async () => {
    render(<SubmitPage />);
    
    // הכנת קובץ תקין
    const validFile = new File(['image content'], 'photo.jpg', { type: 'image/jpeg' });
    
    // מילוי הטופס
    fireEvent.change(screen.getByLabelText(/שם הנופל\/ת/i), { target: { value: 'שם לדוגמה' } });
    
    // העלאת הקובץ
    const fileInput = screen.getByLabelText(/תמונה/i);
    userEvent.upload(fileInput, validFile);
    
    // שליחת הטופס
    fireEvent.click(screen.getByRole('button', { name: /שלח/i }));
    
    // המתנה לסיום התהליך
    await waitFor(() => {
      // בדיקה שנעשתה קריאה לאחסון
      expect(supabase.storage.from).toHaveBeenCalledWith('fallen-images');
      expect(supabase.storage.from().upload).toHaveBeenCalledWith('mocked-uuid.jpg', validFile);
      
      // בדיקה שנעשתה קריאה להוספת רשומה
      expect(supabase.from).toHaveBeenCalledWith('fallen');
      expect(supabase.from().insert).toHaveBeenCalledWith([
        { name: 'שם לדוגמה', image_path: 'mocked-uuid.jpg', approved: false }
      ]);
    });
    
    // בדיקה שמוצגת הודעת תודה
    await waitFor(() => {
      expect(screen.getByText(/תודה על השליחה/i)).toBeInTheDocument();
    });
  });

  it('handles upload error', async () => {
    // הגדרת שגיאת העלאה
    (supabase.storage.from().upload as jest.Mock).mockResolvedValue({ error: new Error('Upload failed') });
    
    render(<SubmitPage />);
    
    // הכנת קובץ תקין ומילוי הטופס
    const validFile = new File(['image content'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText(/שם הנופל\/ת/i), { target: { value: 'שם לדוגמה' } });
    userEvent.upload(screen.getByLabelText(/תמונה/i), validFile);
    
    // שליחת הטופס
    fireEvent.click(screen.getByRole('button', { name: /שלח/i }));
    
    // המתנה להופעת הודעת שגיאה
    await waitFor(() => {
      expect(screen.getByText(/אירעה שגיאה בעת שליחת הטופס/i)).toBeInTheDocument();
    });
  });
}); 