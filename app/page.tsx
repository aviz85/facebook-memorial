import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
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
          
          <Link 
            href="/dashboard" 
            className="bg-gray-200 text-memorial-gray px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-300 transition-colors"
          >
            כניסה למנהלים
          </Link>
        </div>
        
        <div className="mt-12 text-sm text-gray-600 dark:text-gray-400">
          <p>
            התוסף לדפדפן כרום מחליף את הפיד של פייסבוק בתמונות זיכרון של הנופלים.
            <a href="#" className="text-blue-600 dark:text-blue-400 underline ml-2">הורדת התוסף</a>
          </p>
        </div>
      </div>
    </div>
  )
} 