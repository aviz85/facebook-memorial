'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'
import AboutModal from './components/AboutModal';
import ExtensionDownloadLink from './components/ExtensionDownloadLink';

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
          
          <p className="text-lg mb-8">
            ברוכים הבאים לפרויקט ההנצחה הדיגיטלי. כאן תוכלו להעלות תמונה ופרטים של יקיריכם שנפלו
            כדי להנציח את זכרם ביום הזיכרון.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
            <Link 
              href="/submit" 
              className="bg-memorial-blue text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-800 transition-colors"
            >
              העלאת תמונה ופרטים
            </Link>
            
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="bg-gray-100 dark:bg-gray-700 text-memorial-blue dark:text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              על הפרויקט
            </button>
          </div>
          
          <div className="mt-12 text-sm text-gray-600 dark:text-gray-400">
            <p>
              התוסף לדפדפן כרום מחליף את הפיד של פייסבוק בתמונות זיכרון של הנופלים.
              <ExtensionDownloadLink />
            </p>
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