/**
 * בדיקות יחידה עבור התוסף לכרום
 * משתמש במוקים מקובץ chromeExtension.mock.js
 */
import { mockDOMElements, contentScriptMock, mockSupabaseData } from '../../mocks/chromeExtension.mock';

describe('Chrome Extension Unit Tests', () => {
  beforeEach(() => {
    // איפוס המוקים לפני כל בדיקה
    mockDOMElements.feedElements.forEach(el => {
      el.style.display = 'block';
    });
    mockDOMElements.memorialContainer = null;
    mockDOMElements.slideshowContainer = null;
    contentScriptMock.fallenRecords = [];
    contentScriptMock.currentIndex = 0;
    
    // איפוס מספרי הקריאות של הפונקציות
    jest.clearAllMocks();
  });

  describe('isMemorialDay function', () => {
    it('returns expected boolean value', () => {
      const result = contentScriptMock.isMemorialDay();
      expect(result).toBe(true);
    });
  });

  describe('isExtensionForceEnabled function', () => {
    it('returns expected boolean value from chrome storage', () => {
      const result = contentScriptMock.isExtensionForceEnabled();
      expect(result).toBe(true);
      expect(global.chrome.storage.sync.get).toHaveBeenCalled();
    });
  });

  describe('hideOriginalFeed function', () => {
    it('hides all feed elements', () => {
      const targetElement = contentScriptMock.hideOriginalFeed();
      
      // בדיקה שכל האלמנטים של הפיד הוסתרו
      mockDOMElements.feedElements.forEach(el => {
        expect(el.style.display).toBe('none');
      });
      
      // בדיקה שהפונקציה החזירה אלמנט מתאים להזרקת התוכן החדש
      expect(targetElement).toBe(mockDOMElements.mainElement);
    });
  });

  describe('injectMemorialFeed function', () => {
    it('creates and injects memorial container', () => {
      const result = contentScriptMock.injectMemorialFeed();
      
      // בדיקה שהקונטיינר נוצר
      expect(result.container).toBeTruthy();
      
      // בדיקה שהקונטיינר הוזרק לאלמנט הראשי
      expect(mockDOMElements.mainElement.prepend).toHaveBeenCalled();
    });
  });

  describe('showSlide function', () => {
    it('shows the correct slide for the given index', () => {
      // קביעת נתונים לבדיקה
      contentScriptMock.fallenRecords = mockSupabaseData.data;
      
      // בדיקת הצגת סלייד מסוים
      const slide = contentScriptMock.showSlide(1);
      
      // וידוא שהפונקציה מחזירה את הרשומה הנכונה
      expect(slide).toBe(mockSupabaseData.data[1]);
    });

    it('returns false if no records are available', () => {
      // איפוס הנתונים
      contentScriptMock.fallenRecords = [];
      
      // בדיקת הצגת סלייד כשאין נתונים
      const result = contentScriptMock.showSlide(0);
      
      // וידוא שהפונקציה מחזירה false במקרה כזה
      expect(result).toBe(false);
    });
  });

  describe('initMemorialFeed function', () => {
    it('initializes the memorial feed when conditions are met', async () => {
      // מעקב אחרי קריאות לפונקציות
      const hideOriginalFeedSpy = jest.spyOn(contentScriptMock, 'hideOriginalFeed');
      const injectMemorialFeedSpy = jest.spyOn(contentScriptMock, 'injectMemorialFeed');
      const startSlideshowSpy = jest.spyOn(contentScriptMock, 'startSlideshow');
      
      // הפעלת הפונקציה
      await contentScriptMock.initMemorialFeed();
      
      // וידוא שכל הפונקציות הנדרשות נקראו
      expect(hideOriginalFeedSpy).toHaveBeenCalled();
      expect(injectMemorialFeedSpy).toHaveBeenCalled();
      expect(startSlideshowSpy).toHaveBeenCalled();
      
      // וידוא שהנתונים נשמרו בצורה נכונה
      expect(contentScriptMock.fallenRecords).toEqual(mockSupabaseData.data);
    });
  });

  describe('Full extension flow', () => {
    it('correctly processes the entire extension flow', async () => {
      // הפעלת התוסף
      const result = await contentScriptMock.initMemorialFeed();
      
      // וידוא הצלחה
      expect(result).toBe(true);
      
      // וידוא שהפיד המקורי הוסתר
      mockDOMElements.feedElements.forEach(el => {
        expect(el.style.display).toBe('none');
      });
      
      // וידוא שהמידע נטען
      expect(contentScriptMock.fallenRecords).toEqual(mockSupabaseData.data);
      
      // סימולציה של הצגת הסלייד הראשון
      const currentSlide = contentScriptMock.showSlide(0);
      expect(currentSlide).toEqual(mockSupabaseData.data[0]);
    });
  });
}); 