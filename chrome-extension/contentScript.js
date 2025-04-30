console.log('Facebook Memorial Feed extension loaded!');
// Add visual confirmation that the extension is running
console.warn('FACEBOOK MEMORIAL FEED EXTENSION IS ACTIVE - CHECK LOG FOR DETAILS');

// Configuration - Supabase credentials
const SUPABASE_URL = 'https://nuepjimdxzybberqffds.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZXBqaW1keHp5YmJlcnFmZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5OTMyMTksImV4cCI6MjA2MTU2OTIxOX0.JI-XONtQgrTTJPdli01Ot84r1JwtYNSWodjflNzdwCU';

// Global variables
let allRecords = []; // All fetched records
let displayQueue = []; // Records currently in the display rotation
let preloadedImages = {}; // Cache for preloaded images
let currentIndex = 0;
let slideInterval = null;
let pageSize = 20; // Number of records to fetch per page
let currentPage = 0; // Current page number
let totalRecords = 0; // Total number of available records
let isTransitioning = false; // Flag to prevent multiple transitions at once

// Mock data for testing when no real records exist
const MOCK_RECORDS = [
  {
    name: "דוגמה - יוסי כהן ז״ל",
    image_path: "mock-image1.jpg"
  },
  {
    name: "דוגמה - רחל לוי ז״ל",
    image_path: "mock-image2.jpg"
  },
  {
    name: "דוגמה - דוד שמעוני ז״ל",
    image_path: "mock-image3.jpg"
  }
];

// Function to get mock image URL
function getMockImageUrl(index) {
  // Use placeholder image services
  const placeholderUrls = [
    'https://via.placeholder.com/400x600.png?text=Memorial+Image+1',
    'https://via.placeholder.com/400x600.png?text=Memorial+Image+2',
    'https://via.placeholder.com/400x600.png?text=Memorial+Image+3'
  ];
  return placeholderUrls[index % placeholderUrls.length];
}

// Initialize and run the extension
async function initMemorialFeed() {
  try {
    console.log('Facebook Memorial Feed extension initializing...');
    
    // Add debugging for DOM readiness
    console.log('Document ready state:', document.readyState);
    
    // Check if it's Israel Memorial Day or if extension is force enabled
    const isForceEnabled = await isExtensionForceEnabled();
    console.log('Force enabled check completed:', isForceEnabled);
    
    // Don't run if extension is not force enabled (and not Memorial Day)
    // In production, you'd uncomment the isMemorialDay() check too
    if (!isForceEnabled) {
      console.log('Extension not forced, exiting');
      return;
    }
    
    console.log('Preparing to fetch data from Supabase');
    
    // First get the total count of approved records
    try {
      const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/fallen?approved=eq.true&select=count`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      });
      
      if (!countResponse.ok) {
        throw new Error(`HTTP error! status: ${countResponse.status}`);
      }
      
      const contentRange = countResponse.headers.get('content-range');
      console.log('Content range header:', contentRange);
      
      // If no content range header, assume no records
      if (!contentRange) {
        console.log('No content-range header, assuming no records exist');
        totalRecords = 0;
      } else {
        try {
          totalRecords = parseInt(contentRange.split('/')[1]);
          console.log(`Total available records: ${totalRecords}`);
        } catch (e) {
          console.error('Error parsing content-range header:', e);
          totalRecords = 0;
        }
      }
      
      // Fetch first batch of records
      await fetchNextBatch();
      
      if (displayQueue.length === 0) {
        console.log('No display queue after fetchNextBatch, this should not happen with mock data');
        throw new Error('Failed to load records and mock data');
      }
      
      // Replace the entire page with our memorial content
      replacePageContent();
      startSlideshow();
    } catch (fetchError) {
      console.error('Error fetching data:', fetchError);
      
      // Still try to show mock data and UI even if fetch fails
      console.log('Attempting to continue with mock data despite fetch error');
      
      // Set up mock data if we have nothing
      if (displayQueue.length === 0) {
        totalRecords = MOCK_RECORDS.length;
        displayQueue = [...MOCK_RECORDS];
      }
      
      // Replace the entire page regardless of fetch errors
      replacePageContent();
      startSlideshow();
    }
  } catch (error) {
    console.error('Facebook Memorial Feed extension error:', error);
  }
}

// Fetch next batch of records with pagination and randomization
async function fetchNextBatch() {
  try {
    // If we already have mock data and no real records, just return
    if (displayQueue.length > 0 && totalRecords === 0) {
      console.log('Already using mock data, no need to fetch more');
      return displayQueue;
    }
    
    // Calculate the offset based on the current page
    const offset = currentPage * pageSize;
    
    // Fetch data using pagination
    console.log(`Attempting to fetch batch from Supabase with offset ${offset}`);
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/fallen?approved=eq.true&select=name,image_path&order=created_at.desc&limit=${pageSize}&offset=${offset}`, 
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const newRecords = await response.json();
    console.log(`Response from Supabase contains ${newRecords.length} records`);
    
    if (!newRecords || newRecords.length === 0) {
      console.log('No records found in Supabase');
      
      // If there are no records at all and this is the first fetch, use mock data
      if (displayQueue.length === 0) {
        console.log('Using mock data for testing - no records found in database');
        // Create a deep copy of mock records to avoid modifications
        const mockData = JSON.parse(JSON.stringify(MOCK_RECORDS));
        totalRecords = mockData.length;
        
        // Add to display queue
        displayQueue = [...mockData];
        console.log(`Added ${mockData.length} mock records to display queue`);
        return mockData;
      }
      
      // If no more records, and we're not using mock data yet, switch to mock
      if (totalRecords === 0) {
        console.log('No records in database, switching to mock data');
        const mockData = JSON.parse(JSON.stringify(MOCK_RECORDS));
        totalRecords = mockData.length;
        displayQueue = [...mockData];
        return mockData;
      }
      
      // If we already have some real records but reached the end
      console.log('Reached end of records, returning to start');
      currentPage = 0;
      return [];
    }
    
    // Add the new records to our collection
    allRecords = [...allRecords, ...newRecords];
    
    // Shuffle the new records and add to display queue
    const shuffled = shuffleArray([...newRecords]);
    displayQueue = [...displayQueue, ...shuffled];
    
    // Increment the page for next fetch
    currentPage++;
    
    console.log(`Fetched ${newRecords.length} new records, display queue now has ${displayQueue.length} items`);
    
    // Preload the next few images
    preloadNextImages();
    
    return newRecords;
  } catch (error) {
    console.error('Error fetching next batch:', error);
    
    // Use mock data on error if we have no records yet
    if (displayQueue.length === 0) {
      console.log('Using mock data due to fetch error');
      
      // Create a deep copy of mock records
      const mockData = JSON.parse(JSON.stringify(MOCK_RECORDS));
      totalRecords = mockData.length;
      displayQueue = [...mockData];
      
      console.log(`Added ${mockData.length} mock records after fetch error`);
      return mockData;
    }
    
    return [];
  }
}

// Fisher-Yates shuffle algorithm for randomizing the records
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Preload the next few images
function preloadNextImages() {
  // Determine which images to preload
  const startIndex = currentIndex;
  const numToPreload = 2; // Preload the next 2 images
  
  for (let i = 1; i <= numToPreload; i++) {
    const index = (startIndex + i) % displayQueue.length;
    
    // If we're running low on images in the queue, fetch more
    if (index >= displayQueue.length - 3 && displayQueue.length < totalRecords) {
      fetchNextBatch();
    }
    
    // Only preload if there's an image at this index
    if (displayQueue[index]) {
      const record = displayQueue[index];
      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/fallen-images/${record.image_path}`;
      
      // Skip if already preloaded
      if (preloadedImages[imageUrl]) continue;
      
      // Create image for preloading
      const img = new Image();
      img.src = imageUrl;
      
      // Store reference to preloaded image
      preloadedImages[imageUrl] = img;
      
      console.log(`Preloaded image: ${record.name}`);
    }
  }
  
  // Clean up old preloaded images to manage memory
  cleanupOldImages();
}

// Remove old preloaded images that we don't need anymore
function cleanupOldImages() {
  // Keep the cache size reasonable (max 10 images)
  const maxCacheSize = 10;
  
  // If cache is too large, remove oldest entries
  const imageUrls = Object.keys(preloadedImages);
  if (imageUrls.length > maxCacheSize) {
    // Remove the oldest entries
    const numToRemove = imageUrls.length - maxCacheSize;
    const oldestUrls = imageUrls.slice(0, numToRemove);
    
    for (const url of oldestUrls) {
      delete preloadedImages[url];
    }
    
    console.log(`Cleaned up ${numToRemove} old preloaded images`);
  }
}

// Check if today is Israel Memorial Day (can be adjusted based on the Hebrew calendar)
function isMemorialDay() {
  // This is a simplified check - in reality you'd want to use the Hebrew calendar
  // or check the exact dates for the current year
  const today = new Date();
  
  // Example: April 13-14, 2024 (approximate for 2024)
  // In reality you should use a Hebrew calendar library to determine Yom HaZikaron dates
  const month = today.getMonth(); // 0-based, 3 = April
  const day = today.getDate();
  
  // This is just a placeholder, replace with actual Yom HaZikaron dates
  return (month === 3 && (day === 13 || day === 14));
}

// Check if user enabled the extension in settings
function isExtensionForceEnabled() {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get(['forceEnabled'], (result) => {
        const isEnabled = result.forceEnabled === true;
        console.log('Extension force enabled setting:', isEnabled);
        resolve(isEnabled);
      });
    } catch (error) {
      console.error('Error checking if extension is force enabled:', error);
      resolve(false); // Default to disabled if there's an error
    }
  });
}

// Replace entire page with memorial content
function replacePageContent() {
  console.log('Replacing entire page content with memorial feed');
  
  // Add a visual debug element to the page to show the script is running
  const debugMark = document.createElement('div');
  debugMark.style.position = 'fixed';
  debugMark.style.bottom = '10px';
  debugMark.style.right = '10px';
  debugMark.style.padding = '5px 10px';
  debugMark.style.backgroundColor = 'rgba(0,0,0,0.7)';
  debugMark.style.color = 'white';
  debugMark.style.zIndex = '9999';
  debugMark.style.borderRadius = '4px';
  debugMark.textContent = 'Memorial Feed Active';
  document.body.appendChild(debugMark);

  // Save the original content in case we need to restore it later
  const originalContent = document.body.innerHTML;
  
  // Create our memorial page container
  const memorialPage = document.createElement('div');
  memorialPage.id = 'memorial-page';
  memorialPage.className = 'memorial-page';
  
  // Create container for our memorial feed
  const memorialContainer = document.createElement('div');
  memorialContainer.id = 'memorial-feed-container';
  memorialContainer.className = 'memorial-container';
  
  // Add headline
  const headline = document.createElement('h1');
  headline.textContent = 'יום הזיכרון לחללי מערכות ישראל ונפגעי פעולות האיבה';
  headline.className = 'memorial-headline';
  memorialContainer.appendChild(headline);
  
  // Add subheadline
  const subheadline = document.createElement('h2');
  subheadline.textContent = 'לזכרם';
  subheadline.className = 'memorial-subheadline';
  memorialContainer.appendChild(subheadline);
  
  // Add slideshow container
  const slideshowContainer = document.createElement('div');
  slideshowContainer.id = 'memorial-slideshow';
  slideshowContainer.className = 'memorial-slideshow';
  memorialContainer.appendChild(slideshowContainer);
  
  // Add message
  const message = document.createElement('p');
  message.textContent = 'במקום לגלול בפייסבוק, אנו מציגים את זכרם של הנופלים';
  message.className = 'memorial-message';
  memorialContainer.appendChild(message);
  
  // Add button to restore original content if needed
  const restoreButton = document.createElement('button');
  restoreButton.textContent = 'חזרה לפייסבוק';
  restoreButton.className = 'memorial-button';
  restoreButton.onclick = function() {
    // Store the decision in local storage
    chrome.storage.sync.set({ forceEnabled: false }, function() {
      console.log('Disabled memorial feed');
      
      // Don't reload, just restore original content if possible
      try {
        document.body.innerHTML = originalContent;
        console.log('Restored original content without reload');
      } catch (e) {
        console.error('Failed to restore content, reloading page', e);
        // Fallback to reload
        window.location.reload();
      }
    });
  };
  memorialContainer.appendChild(restoreButton);
  
  // Add the container to our page
  memorialPage.appendChild(memorialContainer);
  
  // Inject CSS styles directly to ensure they load
  injectStyles();
  
  // Clear the body and add our content
  document.body.innerHTML = '';
  document.body.appendChild(memorialPage);
  
  // Re-add the debug mark since we cleared the body
  document.body.appendChild(debugMark);
  
  return {
    container: memorialContainer,
    slideshow: slideshowContainer
  };
}

// Inject CSS styles directly into the page
function injectStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    body {
      margin: 0;
      padding: 0;
      background-color: #f0f2f5;
      font-family: Arial, sans-serif;
    }
    
    .memorial-page {
      width: 100%;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f0f2f5;
      padding: 20px;
      box-sizing: border-box;
    }
    
    .memorial-container {
      max-width: 800px;
      width: 100%;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      direction: rtl;
      text-align: center;
      padding: 20px;
    }
    
    .memorial-headline {
      color: #1877f2;
      font-size: 24px;
      margin-bottom: 10px;
      font-weight: bold;
    }
    
    .memorial-subheadline {
      color: #333;
      font-size: 20px;
      margin-bottom: 20px;
    }
    
    .memorial-slideshow {
      position: relative;
      height: 500px;
      overflow: hidden;
      background-color: #000;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    
    .memorial-slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .memorial-image {
      max-height: 400px;
      max-width: 100%;
      object-fit: contain;
      border-radius: 4px;
    }
    
    .memorial-name {
      color: white;
      background-color: rgba(0, 0, 0, 0.7);
      padding: 10px 20px;
      border-radius: 4px;
      margin-top: 10px;
      font-size: 20px;
    }
    
    .memorial-message {
      color: #333;
      font-size: 16px;
      margin-bottom: 20px;
    }
    
    .memorial-button {
      background-color: #1877f2;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .memorial-button:hover {
      background-color: #166fe5;
    }
    
    .memorial-fade {
      transition: opacity 1s ease-in-out;
    }
    
    @media (max-width: 600px) {
      .memorial-container {
        margin: 10px;
        width: auto;
      }
      
      .memorial-slideshow {
        height: 400px;
      }
      
      .memorial-headline {
        font-size: 20px;
      }
    }
  `;
  document.head.appendChild(styleElement);
}

// Start the slideshow rotating through the fallen records
function startSlideshow() {
  // If we have an existing interval, clear it
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
  }
  
  // Create two permanent slide elements
  setupSlideContainers();
  
  // Show the first image immediately
  showSlide(currentIndex);
  
  // Set up a timer to change images every 5 seconds
  slideInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % displayQueue.length;
    
    // If we're near the end of our display queue, try to fetch more
    if (currentIndex >= displayQueue.length - 3) {
      preloadNextImages();
    }
    
    showSlide(currentIndex);
  }, 2000);
}

// Create permanent slide containers
function setupSlideContainers() {
  const slideshowContainer = document.getElementById('memorial-slideshow');
  if (!slideshowContainer) {
    console.error('Slideshow container not found');
    return;
  }
  
  // Clear any existing content
  slideshowContainer.innerHTML = '';
  
  // Create two permanent slides that we'll toggle between
  const slide1 = document.createElement('div');
  slide1.className = 'memorial-slide';
  slide1.id = 'memorial-slide-1';
  slide1.style.opacity = '1'; // First slide is visible
  slideshowContainer.appendChild(slide1);
  
  const slide2 = document.createElement('div');
  slide2.className = 'memorial-slide';
  slide2.id = 'memorial-slide-2';
  slide2.style.opacity = '0'; // Second slide is hidden
  slideshowContainer.appendChild(slide2);
}

// Display a specific slide
function showSlide(index) {
  const record = displayQueue[index];
  const slideshowContainer = document.getElementById('memorial-slideshow');
  
  if (!slideshowContainer) {
    console.error('Slideshow container not found');
    return;
  }
  
  if (!record) {
    console.error('No record found at index', index);
    
    // If we have no records at all, create a fallback record
    if (displayQueue.length === 0) {
      console.log('Display queue is empty, creating fallback record');
      const fallbackRecord = {
        name: "תמונת זיכרון",
        image_path: "mock-image1.jpg"
      };
      displayQueue.push(fallbackRecord);
      setTimeout(() => showSlide(0), 100); // Retry with the fallback record
      return;
    }
    
    return;
  }
  
  console.log(`Showing slide for: ${record.name}`);
  
  // Create image URL from path
  let imageUrl;
  
  // If it's a mock record, use placeholder image
  if (record.image_path.startsWith('mock-image')) {
    const mockIndex = parseInt(record.image_path.replace('mock-image', '').replace('.jpg', '')) - 1;
    imageUrl = getMockImageUrl(mockIndex);
    console.log('Using mock image URL:', imageUrl);
  } else {
    imageUrl = `${SUPABASE_URL}/storage/v1/object/public/fallen-images/${record.image_path}`;
  }
  
  // Find which slide is currently visible and which is hidden
  const slide1 = document.getElementById('memorial-slide-1');
  const slide2 = document.getElementById('memorial-slide-2');
  
  if (!slide1 || !slide2) {
    console.error('Slide elements not found, recreating them');
    setupSlideContainers();
    setTimeout(() => showSlide(index), 100);
    return;
  }
  
  const visibleSlide = slide1.style.opacity === '1' ? slide1 : slide2;
  const hiddenSlide = slide1.style.opacity === '0' ? slide1 : slide2;
  
  // Prepare the hidden slide with new content before showing it
  hiddenSlide.innerHTML = '';
  
  // Create and add the image
  const imageElement = new Image();
  imageElement.className = 'memorial-image';
  imageElement.alt = record.name;
  
  // Use preloaded image if available
  if (preloadedImages[imageUrl]) {
    console.log(`Using preloaded image for ${record.name}`);
    imageElement.src = preloadedImages[imageUrl].src;
  } else {
    console.log(`No preloaded image for ${record.name}, loading directly`);
    imageElement.src = imageUrl;
  }
  
  // Handle image load errors
  imageElement.onerror = function() {
    console.log('Image failed to load, using fallback');
    this.src = 'https://via.placeholder.com/400x600.png?text=Memorial+Image';
    this.onerror = null; // Prevent infinite error handling loop
  };
  
  hiddenSlide.appendChild(imageElement);
  
  // Add the name
  const nameElement = document.createElement('h2');
  nameElement.textContent = record.name;
  nameElement.className = 'memorial-name';
  hiddenSlide.appendChild(nameElement);
  
  // Wait for image to load before starting transition
  if (imageElement.complete) {
    swapSlides(visibleSlide, hiddenSlide);
  } else {
    // If image is still loading, wait for it
    imageElement.onload = () => {
      swapSlides(visibleSlide, hiddenSlide);
    };
    
    // If loading takes too long, show anyway after a timeout
    setTimeout(() => {
      if (hiddenSlide.style.opacity === '0') {
        swapSlides(visibleSlide, hiddenSlide);
      }
    }, 2000);
  }
  
  // Preload next images for smoother viewing
  preloadNextImages();
}

// Simple function to swap slide visibility
function swapSlides(currentSlide, nextSlide) {
  // Fade in the new slide
  nextSlide.style.opacity = '1';
  // Fade out the current slide
  currentSlide.style.opacity = '0';
}

// Set up repeated checks to make sure the extension activates properly
let activationAttempts = 0;
const MAX_ACTIVATION_ATTEMPTS = 3; // Reduced since we don't need to wait for feed
const ACTIVATION_INTERVAL = 1000; // 1 second

function attemptActivation() {
  console.log(`Activation attempt ${activationAttempts + 1}/${MAX_ACTIVATION_ATTEMPTS}`);
  
  if (activationAttempts >= MAX_ACTIVATION_ATTEMPTS) {
    console.log('Reached max activation attempts, trying anyway');
    initMemorialFeed();
    return;
  }
  
  activationAttempts++;
  
  // We're no longer looking for feed elements, just start the process
  console.log('Initializing memorial feed on attempt ' + activationAttempts);
  initMemorialFeed();
}

// Start activation attempts when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting activation attempts');
    setTimeout(attemptActivation, 1000);
  });
} else {
  console.log('Document already loaded, starting activation attempts');
  setTimeout(attemptActivation, 1000);
}

// Wait for the page to be loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, will initialize memorial feed shortly');
  
  // Short delay to ensure page is fully rendered
  setTimeout(() => {
    initMemorialFeed();
  }, 1000);
});

// Also try to initialize after window loads
window.addEventListener('load', () => {
  console.log('Window loaded, will initialize memorial feed shortly');
  
  // Short delay to ensure page is fully rendered
  setTimeout(() => {
    initMemorialFeed();
  }, 1000);
});

// Initialize right away for cases where the page is already loaded
console.log('Attempting immediate initialization');
setTimeout(() => {
  initMemorialFeed();
}, 500);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.action === 'checkStatus') {
    console.log('Status check received, extension is active');
    sendResponse({ status: 'active' });
  }
  else if (message.action === 'forceRefresh') {
    console.log('Force refresh requested');
    // Force reinitialize
    initMemorialFeed();
    sendResponse({ status: 'refreshing' });
  }
  
  // Return true to indicate async response
  return true;
});

// Also listen for direct activation event from the page
document.addEventListener('facebookMemorialFeedActivate', (event) => {
  console.log('Received direct activation event', event.detail);
  initMemorialFeed();
}); 