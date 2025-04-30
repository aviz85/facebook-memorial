/**
 * קובץ מוקים עבור תוסף הכרום
 * מדמה את הפונקציונליות של התוסף ללא צורך בסביבת דפדפן אמיתית
 */

// מוק ל-DOM Elements שיתבצע עליהם מניפולציה
const mockDOMElements = {
  feedElements: [
    { style: { display: 'block' } },
    { style: { display: 'block' } }
  ],
  memorialContainer: null,
  slideshowContainer: null,
  mainElement: { prepend: jest.fn() }
};

// מוק לשכבת ה-DOM
global.document = {
  querySelector: jest.fn((selector) => {
    if (selector === '[role="main"]') return mockDOMElements.mainElement;
    return null;
  }),
  querySelectorAll: jest.fn((selector) => {
    if (selector.includes('feed') || selector.includes('Feed')) {
      return mockDOMElements.feedElements;
    }
    return [];
  }),
  createElement: jest.fn((tag) => {
    if (tag === 'div') {
      const element = {
        className: '',
        id: '',
        style: {},
        appendChild: jest.fn(),
      };
      
      if (!mockDOMElements.memorialContainer) {
        mockDOMElements.memorialContainer = element;
        return element;
      } else if (!mockDOMElements.slideshowContainer) {
        mockDOMElements.slideshowContainer = element;
        return element;
      } else {
        // רשימה של סלייד חדש
        return { 
          className: '', 
          style: {}, 
          appendChild: jest.fn() 
        };
      }
    }
    
    if (tag === 'h1' || tag === 'h2') {
      return { 
        textContent: '', 
        className: '' 
      };
    }
    
    if (tag === 'img') {
      return { 
        src: '', 
        alt: '', 
        className: '' 
      };
    }
    
    return {};
  }),
  getElementById: jest.fn((id) => {
    if (id === 'memorial-slideshow') return mockDOMElements.slideshowContainer;
    return null;
  }),
  body: {
    prepend: jest.fn()
  },
  readyState: 'complete'
};

// מוק לאובייקט חלון
global.window = {
  addEventListener: jest.fn(),
};

// מוק לפונקציות סופבייס של התוסף
const mockSupabaseData = {
  data: [
    { name: 'שם1', image_path: 'image1.jpg' },
    { name: 'שם2', image_path: 'image2.jpg' }
  ],
  error: null
};

global.chrome = {
  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        callback({ forceEnabled: true });
      }),
      set: jest.fn()
    }
  }
};

// מדמה את הקובץ contentScript.js
const contentScriptMock = {
  SUPABASE_URL: 'https://nuepjimdxzybberqffds.supabase.co',
  SUPABASE_ANON_KEY: 'mock-key',
  fallenRecords: [],
  currentIndex: 0,
  slideInterval: null,
  
  isMemorialDay() {
    return true;
  },
  
  isExtensionForceEnabled() {
    return true;
  },
  
  hideOriginalFeed() {
    // מוק לפונקציית הסתרת הפיד
    mockDOMElements.feedElements.forEach(el => {
      el.style.display = 'none';
    });
    
    return mockDOMElements.mainElement;
  },
  
  injectMemorialFeed() {
    // מוק לפונקציית הזרקת תוכן זיכרון
    const container = mockDOMElements.memorialContainer;
    const slideshow = mockDOMElements.slideshowContainer;
    
    mockDOMElements.mainElement.prepend(container);
    
    return {
      container,
      slideshow
    };
  },
  
  startSlideshow() {
    this.fallenRecords = mockSupabaseData.data;
    return true;
  },
  
  showSlide(index) {
    if (!this.fallenRecords || !this.fallenRecords.length) return false;
    
    const record = this.fallenRecords[index || 0];
    return record;
  },
  
  async initMemorialFeed() {
    // מוק לפונקצית האתחול הראשית
    if (!this.isMemorialDay() && !this.isExtensionForceEnabled()) {
      return false;
    }
    
    this.fallenRecords = mockSupabaseData.data;
    this.hideOriginalFeed();
    this.injectMemorialFeed();
    this.startSlideshow();
    
    return true;
  }
};

module.exports = {
  mockDOMElements,
  contentScriptMock,
  mockSupabaseData
}; 