'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AboutModal from '../components/AboutModal';

export default function SubmitPage() {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [connectionContext, setConnectionContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  // Set RTL direction for Hebrew text
  useEffect(() => {
    document.documentElement.dir = 'rtl';
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (1MB limit)
      if (selectedFile.size > 1024 * 1024) {
        setError('גודל הקובץ חורג מ-1 מגה-בייט. אנא בחר קובץ קטן יותר.');
        setFile(null);
        e.target.value = '';
        return;
      }
      
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        setError('יש להעלות קובץ תמונה בלבד.');
        setFile(null);
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };
  
  // Function to check if user is rate limited
  const checkRateLimit = async () => {
    try {
      // In a real environment, we would use the client's IP address
      // For this example, we'll use a function that determines if submissions are allowed
      const { data, error } = await supabase.rpc('check_submission_rate_limit', { 
        ip: 'client-ip-would-go-here',
        limit_count: 5,
        cooldown_minutes: 60
      });
      
      if (error) throw error;
      
      // If data is false, the user is rate limited
      if (data === false) {
        setIsRateLimited(true);
        setError('הגעת למגבלת ההעלאות (5 העלאות בשעה). אנא נסה שוב מאוחר יותר.');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("Error checking rate limit:", err);
      // If there's an error, allow the submission to proceed
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('יש להזין את שם הנופל/ת');
      return;
    }
    
    if (!file) {
      setError('יש לבחור תמונה');
      return;
    }
    
    // Check if user is rate limited before proceeding
    const canProceed = await checkRateLimit();
    if (!canProceed) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // יצירת FormData לשליחת הנתונים והתמונה
      const formData = new FormData();
      formData.append('name', name);
      formData.append('file', file);
      formData.append('connectionContext', connectionContext);
      
      // שליחה לשרת
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'אירעה שגיאה בעת שליחת הטופס');
      }
      
      // Success!
      setSubmitted(true);
      setName('');
      setFile(null);
      setConnectionContext('');
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(err.message || 'אירעה שגיאה בעת שליחת הטופס. אנא נסה שנית מאוחר יותר.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white dark:bg-memorial-gray rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-memorial-blue dark:text-white">תודה על השליחה</h1>
          <p className="mb-6">
            הפרטים והתמונה נשלחו בהצלחה. הם יוצגו לאחר אישור המנהלים.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              href="/" 
              className="inline-block bg-memorial-blue text-white px-4 py-2 rounded-md"
            >
              חזרה לדף הראשי
            </Link>
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="inline-block bg-gray-200 dark:bg-gray-700 text-memorial-blue dark:text-white px-4 py-2 rounded-md"
            >
              על הפרויקט
            </button>
          </div>
        </div>
        
        {/* About Modal */}
        <AboutModal 
          isOpen={isAboutModalOpen} 
          onClose={() => setIsAboutModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-white dark:bg-memorial-gray rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-memorial-blue dark:text-white">
          טופס העלאת פרטי נופל/ת
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md" data-testid="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 font-medium">
              שם הנופל/ת <span className="text-gray-500 text-sm">(כולל דרגה במקרה של חייל/ת)</span>
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting || isRateLimited}
              placeholder="למשל: סמל ראשון ישראל ישראלי"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="photo" className="block mb-2 font-medium">
              תמונה (עד 1 מגה-בייט)
            </label>
            <input
              type="file"
              id="photo"
              className="w-full"
              accept="image/*"
              onChange={handleFileChange}
              required
              disabled={isSubmitting || isRateLimited}
            />
            <p className="mt-1 text-sm text-gray-500">
              ניתן להעלות תמונות מסוג JPG, PNG או WEBP
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="connection_context" className="block mb-2 font-medium">
              הקשר שיכול לסייע לנו לאשר את התמונה
            </label>
            <textarea
              id="connection_context"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={connectionContext}
              onChange={(e) => setConnectionContext(e.target.value)}
              rows={3}
              disabled={isSubmitting || isRateLimited}
              placeholder="למשל: קרוב משפחה, חבר ליחידה, מקור התמונה"
            ></textarea>
            <p className="mt-1 text-sm text-gray-500">
              מידע זה הוא למטרות אימות בלבד ולא יוצג באתר
            </p>
          </div>
          
          <button
            type="submit"
            className="w-full bg-memorial-blue text-white py-2 rounded-md hover:bg-blue-800 transition-colors disabled:bg-gray-400"
            disabled={isSubmitting || isRateLimited}
          >
            {isSubmitting ? 'שולח...' : 'שלח'}
          </button>
        </form>
        
        <div className="mt-6 flex justify-between">
          <Link href="/" className="text-memorial-blue dark:text-blue-400">
            חזרה לדף הראשי
          </Link>
          <button
            type="button"
            onClick={() => setIsAboutModalOpen(true)}
            className="text-memorial-blue dark:text-blue-400"
          >
            על הפרויקט
          </button>
        </div>
      </div>
      
      {/* About Modal */}
      <AboutModal 
        isOpen={isAboutModalOpen} 
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
} 