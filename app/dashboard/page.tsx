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
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth');
        const data = await response.json();
        
        if (data.isAuthenticated) {
          setIsAdmin(true);
          fetchPendingRecords();
        } else {
          // Fallback to Supabase auth if available
          const { data: { user } } = await supabase.auth.getUser();
          if (user && user.user_metadata && user.user_metadata.role === 'admin') {
            setIsAdmin(true);
            fetchPendingRecords();
          }
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Handle password authentication
  const handleAuthenticate = async () => {
    setAuthLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsAdmin(true);
        fetchPendingRecords();
      } else {
        setError(data.error || 'שגיאת התחברות');
      }
    } catch (err) {
      setError('שגיאת התחברות');
      console.error('Authentication error:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchPendingRecords = async (filter = statusFilter) => {
    try {
      const response = await fetch(`/api/admin/pending?filter=${filter}`);
      const result = await response.json();
      
      if (response.ok) {
        setPendingRecords(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch pending records');
      }
    } catch (err: any) {
      setError('שגיאה בטעינת הבקשות');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve entry');
      }
      
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

  // New function to handle rejection
  const handleReject = async (id: string) => {
    try {
      const response = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject entry');
      }
      
      setSuccess('הרשומה נדחתה');
      // Remove the rejected record from the list
      setPendingRecords(pendingRecords.filter(record => record.id !== id));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('שגיאה בדחיית הרשומה');
      console.error(err);
    }
  };

  // New function to handle filter change
  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    fetchPendingRecords(filter);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'DELETE',
      });
      setIsAdmin(false);
    } catch (err) {
      console.error('Logout error:', err);
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
          <h1 className="text-2xl font-bold mb-4 text-memorial-blue dark:text-white">כניסה למנהלים</h1>
          
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="הזן סיסמת מנהל"
              className="w-full p-2 border border-gray-300 rounded-md text-right"
              onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
              disabled={authLoading}
            />
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={handleAuthenticate}
              className="bg-memorial-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              disabled={authLoading}
            >
              {authLoading ? 'מתחבר...' : 'כניסה'}
            </button>
            
            <Link 
              href="/" 
              className="bg-gray-200 text-memorial-gray px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              חזרה לדף הראשי
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-memorial-blue dark:text-white">
          ניהול בקשות העלאה
        </h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          התנתק
        </button>
      </div>
      
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
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">
            {statusFilter === 'pending' && 'בקשות ממתינות לאישור'}
            {statusFilter === 'rejected' && 'בקשות שנדחו'}
            {statusFilter === 'approved' && 'בקשות שאושרו'}
            {statusFilter === 'all' && 'כל הבקשות'}
          </h2>
          <Link 
            href="/" 
            className="bg-gray-200 text-memorial-gray px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            חזרה לדף הראשי
          </Link>
        </div>
        
        {/* Filter tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => handleFilterChange('pending')}
            className={`px-4 py-2 font-medium ${
              statusFilter === 'pending'
                ? 'border-b-2 border-memorial-blue text-memorial-blue'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ממתינות
          </button>
          <button
            onClick={() => handleFilterChange('rejected')}
            className={`px-4 py-2 font-medium ${
              statusFilter === 'rejected'
                ? 'border-b-2 border-memorial-blue text-memorial-blue'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            נדחו
          </button>
          <button
            onClick={() => handleFilterChange('approved')}
            className={`px-4 py-2 font-medium ${
              statusFilter === 'approved'
                ? 'border-b-2 border-memorial-blue text-memorial-blue'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            אושרו
          </button>
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 font-medium ${
              statusFilter === 'all'
                ? 'border-b-2 border-memorial-blue text-memorial-blue'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            הכל
          </button>
        </div>
      </div>
      
      {pendingRecords.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">אין בקשות להצגה בסטטוס זה.</p>
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
                
                {/* Status badges */}
                {record.approved && (
                  <div className="mb-2 inline-block px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">מאושר</div>
                )}
                {record.rejected && (
                  <div className="mb-2 inline-block px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs">נדחה</div>
                )}
                
                {/* Action buttons - show based on status */}
                {!record.approved && !record.rejected && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprove(record.id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      אישור
                    </button>
                    <button 
                      onClick={() => handleReject(record.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      דחייה
                    </button>
                  </div>
                )}
                
                {/* For approved/rejected entries, allow status change */}
                {(record.approved || record.rejected) && (
                  <div className="flex gap-2">
                    {record.rejected && (
                      <button 
                        onClick={() => handleApprove(record.id)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        אישור
                      </button>
                    )}
                    {record.approved && (
                      <button 
                        onClick={() => handleReject(record.id)}
                        className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
                      >
                        דחייה
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 