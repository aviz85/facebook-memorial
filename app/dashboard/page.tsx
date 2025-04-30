'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, FallenRecord, getPendingFallenRecords, approveFallenRecord, getImageUrl } from '@/lib/supabase';

export default function DashboardPage() {
  const [pendingRecords, setPendingRecords] = useState<FallenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata && user.user_metadata.role === 'admin') {
        setIsAdmin(true);
        fetchPendingRecords();
      } else {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, []);

  const fetchPendingRecords = async () => {
    try {
      const data = await getPendingFallenRecords();
      setPendingRecords(data);
    } catch (err: any) {
      setError('שגיאה בטעינת הבקשות הממתינות');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveFallenRecord(id);
      setSuccess('הרשומה אושרה בהצלחה');
      // Remove the approved record from the list
      setPendingRecords(pendingRecords.filter(record => record.id !== id));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('שגיאה באישור הרשומה');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">טוען...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white dark:bg-memorial-gray rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-memorial-blue dark:text-white">גישה נדחית</h1>
          <p className="mb-6">
            רק מנהלים רשאים לגשת לעמוד זה.
          </p>
          <Link 
            href="/" 
            className="inline-block bg-memorial-blue text-white px-4 py-2 rounded-md"
          >
            חזרה לדף הראשי
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-memorial-blue dark:text-white">
        ניהול בקשות העלאה
      </h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">בקשות ממתינות לאישור</h2>
        <Link 
          href="/" 
          className="bg-gray-200 text-memorial-gray px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          חזרה לדף הראשי
        </Link>
      </div>
      
      {pendingRecords.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">אין בקשות ממתינות לאישור.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingRecords.map(record => (
            <div 
              key={record.id} 
              className="bg-white dark:bg-memorial-gray rounded-lg shadow-md overflow-hidden"
            >
              <div className="h-64 overflow-hidden">
                <img 
                  src={getImageUrl(record.image_path)} 
                  alt={record.name} 
                  className="w-full h-full object-cover object-center"
                />
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-medium mb-2">{record.name}</h3>
                <p className="text-sm text-gray-500 mb-1">
                  נוסף: {new Date(record.created_at).toLocaleDateString('he-IL')}
                </p>
                
                {record.connection_context && (
                  <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">
                    <h4 className="font-medium mb-1">הקשר/מידע נוסף:</h4>
                    <p className="text-gray-700 dark:text-gray-300">{record.connection_context}</p>
                  </div>
                )}
                
                <button 
                  onClick={() => handleApprove(record.id)}
                  className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  אשר
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 