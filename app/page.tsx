'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'
import AboutModal from './components/AboutModal';
import { FiDownload, FiInfo } from 'react-icons/fi';

export default function Home() {
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  
  // Set RTL direction for Hebrew text
  useEffect(() => {
    document.documentElement.dir = 'rtl';
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-4 text-center">
      {/* Admin link in top right */}
      <div className="w-full flex justify-end mb-4">
        <Link 
          href="/dashboard" 
          className="text-xs text-gray-500 hover:text-memorial-blue transition-colors"
        >
          כניסה למנהלים
        </Link>
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="max-w-3xl mx-auto bg-white dark:bg-memorial-gray rounded-lg shadow-lg p-8 my-8">
          <h1 className="text-3xl md:text-4xl font-bold text-memorial-blue dark:text-white mb-6">
            יום הזיכרון לחללי מערכות ישראל ונפגעי פעולות האיבה
          </h1>
          
          <p className="text-lg mb-6">
            ברוכים הבאים לפרויקט ההנצחה הדיגיטלי. כאן תוכלו להעלות תמונה ופרטים של יקיריכם שנפלו
            כדי להנציח את זכרם ביום הזיכרון.
          </p>
          
          {/* Extension Download Section */}
          <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg border border-blue-200 dark:border-gray-600 mb-8">
            <h2 className="text-xl font-bold text-memorial-blue dark:text-white mb-3">
              תוסף פייסבוק לזכרם - החלפת הפיד בתמונות זיכרון
            </h2>
            <p className="mb-4">
              התוסף שלנו מחליף את הפיד של פייסבוק בתמונות זיכרון של הנופלים ביום הזיכרון.
            </p>
            
            <div className="flex justify-center mb-6">
              <Link 
                href="/dist/facebook-memorial-extension.zip" 
                download
                className="bg-memorial-blue text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-800 transition-colors inline-flex items-center gap-2"
              >
                <FiDownload className="h-5 w-5" />
                <span>הורדת התוסף</span>
              </Link>
            </div>
            
            <div className="text-sm bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="font-bold mb-2 text-memorial-blue dark:text-white">הוראות התקנה פשוטות:</h3>
              <ol className="list-decimal list-inside text-right space-y-1 text-gray-700 dark:text-gray-300">
                <li>הורידו את קובץ ה-ZIP באמצעות הכפתור למעלה</li>
                <li>חלצו את הקובץ למיקום כלשהו במחשב</li>
                <li>פתחו את דפדפן Chrome וכתבו בשורת הכתובת: <code dir="ltr" className="bg-gray-100 dark:bg-gray-700 p-1 rounded">chrome://extensions</code></li>
                <li>הפעילו את "מצב המפתח" בצד ימין למעלה</li>
                <li>לחצו על "טען תוסף שנפרס" ובחרו את התיקייה שחילצתם</li>
              </ol>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-4">
            <Link 
              href="/submit" 
              className="bg-memorial-blue text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-800 transition-colors"
            >
              העלאת תמונה ופרטים
            </Link>
            
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="bg-gray-100 dark:bg-gray-700 text-memorial-blue dark:text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors inline-flex items-center justify-center gap-2"
            >
              <FiInfo className="h-5 w-5" />
              <span>על הפרויקט</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* About Modal */}
      <AboutModal 
        isOpen={isAboutModalOpen} 
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  )
} 