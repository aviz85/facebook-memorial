'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AboutPage() {
  // Set RTL direction for Hebrew text
  useEffect(() => {
    document.documentElement.dir = 'rtl';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-memorial-gray py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-center text-memorial-blue dark:text-white mb-8">
          על הפרויקט
        </h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-memorial-blue dark:text-blue-300">הרעיון</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            רשת פייסבוק, שבעברית אפשר לכנותה גם "ספר פנים", מקבלת משמעות מיוחדת ביום הזיכרון לחללי מערכות ישראל.
            ביום זה, אנחנו בוחרים להזכיר את הפנים של אלו שאיבדנו - פנים שבחרנו לזכור ולהנציח.
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            הפרויקט שואף להחליף את זרם המידע הצפוף והמהיר של פייסבוק, שלעיתים מקשה עלינו להתעמק 
            ולהתחבר לדברים שחשובים באמת, במיוחד ביום משמעותי כמו יום הזיכרון, בחוויה מכבדת שמאפשרת להתייחד עם זכר הנופלים.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-memorial-blue dark:text-blue-300">איך זה עובד?</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            מדובר בתוסף לדפדפן כרום שלוקח את הפיד הרגיל של פייסבוק ומחליף אותו בתצוגת תמונות ושמות של נופלים
            שהועלו על-ידי אנשים מהקהילה. התוסף נכנס לפעולה אך ורק ביום הזיכרון (או אם בחרת להפעיל אותו באופן ידני
            בהגדרות התוסף).
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            כל אחד יכול להעלות תמונה ושם של נופל/ת, כאשר המידע נשמר במערכת שלנו ומוצג רק לאחר בדיקה ואישור.
            אנו מבקשים לשמור על פורמט אחיד ופשוט - שם (כולל דרגה במקרה של חיילים) ותמונה - כדי ליצור מרחב זיכרון נקי ומכבד.
          </p>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-memorial-blue dark:text-blue-300">שותפות</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            הפרויקט הוא מיזם קהילתי ששואף לחבר בין אנשים וזכרונות. אם יש לך תמונה של אדם יקר שנפל
            במערכות ישראל או בפעולות איבה, אנחנו מזמינים אותך להשתתף.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            נבקש לציין פרטי קשר או הקשר שיסייע לנו לאשר את התמונה, אך מידע זה לא יוצג באתר.
          </p>
        </section>
        
        <div className="flex justify-center mt-10">
          <Link
            href="/submit"
            className="bg-memorial-blue hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-md transition duration-300"
          >
            העלאת תמונה
          </Link>
          <Link
            href="/"
            className="mr-4 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-memorial-blue dark:text-white font-bold py-3 px-6 rounded-md transition duration-300"
          >
            דף הבית
          </Link>
        </div>
      </div>
    </div>
  );
} 