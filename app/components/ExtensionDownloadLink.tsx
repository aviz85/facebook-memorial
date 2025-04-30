'use client';

import Link from 'next/link';
import { FiDownload } from 'react-icons/fi';

export default function ExtensionDownloadLink() {
  return (
    <Link 
      href="/downloads/facebook-memorial-extension.zip" 
      download
      className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
    >
      <FiDownload className="h-4 w-4" />
      <span>הורדת התוסף</span>
    </Link>
  );
} 