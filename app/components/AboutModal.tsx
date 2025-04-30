'use client';

import { Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';

type AboutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const cancelButtonRef = useRef(null);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        onClose={onClose}
        dir="rtl"
      >
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>
          
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full px-4 py-5 sm:p-6">
              <div>
                <div className="mt-3 sm:mt-5">
                  <Dialog.Title as="h3" className="text-2xl leading-6 font-bold text-center text-memorial-blue dark:text-white mb-6">
                    על הפרויקט
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <p className="text-gray-700 dark:text-gray-300">
                      רשת פייסבוק, שבעברית אפשר לכנותה גם "ספר פנים", מקבלת משמעות מיוחדת ביום הזיכרון לחללי מערכות ישראל.
                      ביום זה, אנחנו בוחרים להזכיר את הפנים של אלו שאיבדנו - פנים שבחרנו לזכור ולהנציח.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      הפרויקט שואף להחליף את זרם המידע הצפוף והמהיר של פייסבוק, שלעיתים מקשה עלינו להתעמק 
                      ולהתחבר לדברים שחשובים באמת, במיוחד ביום משמעותי כמו יום הזיכרון.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      כל אחד יכול להעלות תמונה ושם של נופל/ת דרך האתר שלנו, והתוסף יציג אותם ביום הזיכרון.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                <Link
                  href="/about"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-memorial-blue text-base font-medium text-white hover:bg-blue-800 focus:outline-none sm:text-sm"
                  onClick={onClose}
                >
                  מידע נוסף
                </Link>
                <button
                  type="button"
                  className="mt-3 sm:mt-0 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 sm:text-sm"
                  onClick={onClose}
                  ref={cancelButtonRef}
                >
                  סגור
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 