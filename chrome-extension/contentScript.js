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

// Initialize and run the extension
async function initMemorialFeed() {
  try {
    console.log('Facebook Memorial Feed extension initializing...');
    
    // Check if it's Israel Memorial Day or if extension is force enabled
    const isForceEnabled = await isExtensionForceEnabled();
    console.log('Force enabled check completed:', isForceEnabled);
    
    // For testing, always run regardless of Memorial Day
    // Remove the condition check for now
    // if (!isMemorialDay() && !isForceEnabled) {
    //   console.log('Not Memorial Day and extension not forced, exiting');
    //   return;
    // }
    
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
      
      totalRecords = parseInt(countResponse.headers.get('content-range').split('/')[1]);
      console.log(`Total available records: ${totalRecords}`);
      
      // Fetch first batch of records
      await fetchNextBatch();
      
      if (displayQueue.length === 0) {
        throw new Error('No approved records found');
      }
      
      // Hide Facebook feed and inject memorial feed
      hideOriginalFeed();
      injectMemorialFeed();
      startSlideshow();
    } catch (fetchError) {
      console.error('Error fetching data:', fetchError);
    }
  } catch (error) {
    console.error('Facebook Memorial Feed extension error:', error);
  }
}

// Fetch next batch of records with pagination and randomization
async function fetchNextBatch() {
  try {
    // Calculate the offset based on the current page
    const offset = currentPage * pageSize;
    
    // Fetch data using pagination
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
    
    if (!newRecords || newRecords.length === 0) {
      // If no more records, wrap around to the beginning
      console.log('Reached end of records, returning to start');
      currentPage = 0;
      return fetchNextBatch();
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

// Hide the original Facebook feed
function hideOriginalFeed() {
  // Primary candidates to hide - using a combination of robust selectors
  const feedSelectors = [
    // Feed containers by role attribute (most stable)
    'div[role="feed"]',
    // Main feed container with typical class pattern
    'div.x193iq5w',
    // Post creation area
    'div[aria-label="Create a post"]',
    // Common feed item containers
    '.x1lliihq',
    // Additional feed identifiers
    '[data-pagelet="FeedUnit"]',
    '#stream_pagelet',
    '[data-pagelet="Stories"]'
  ];
  
  // Use content-based fallback selectors as well
  const contentSelectors = [
    // Elements containing typical feed texts
    'span:contains("What\'s on your mind")',
    'h3:contains("Create a post")'
  ];
  
  let feedElementsFound = false;
  
  // Try to find and hide feed elements
  for (const selector of feedSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      feedElementsFound = true;
      for (const element of elements) {
        element.style.display = 'none';
      }
    }
  }
  
  // If none of the primary selectors worked, look for parent elements of content
  if (!feedElementsFound) {
    for (const selector of contentSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          // Hide the fourth ancestor which is typically the feed container
          let parent = element;
          for (let i = 0; i < 4 && parent; i++) {
            parent = parent.parentElement;
          }
          if (parent) {
            parent.style.display = 'none';
            feedElementsFound = true;
          }
        }
      } catch (e) {
        console.log("Error with selector:", selector, e);
      }
    }
  }
  
  // Find a good insertion point - prioritize main content area
  return document.querySelector('[role="main"]') || 
         document.querySelector('div.x193iq5w') || 
         document.querySelector('div.xod5an3') || 
         document.body;
}

// Inject our memorial feed container
function injectMemorialFeed() {
  // Create container for our memorial feed
  const memorialContainer = document.createElement('div');
  memorialContainer.id = 'memorial-feed-container';
  memorialContainer.className = 'memorial-container';
  
  // Add headline
  const headline = document.createElement('h1');
  headline.textContent = 'יום הזיכרון לחללי מערכות ישראל ונפגעי פעולות האיבה';
  headline.className = 'memorial-headline';
  memorialContainer.appendChild(headline);
  
  // Add slideshow container
  const slideshowContainer = document.createElement('div');
  slideshowContainer.id = 'memorial-slideshow';
  slideshowContainer.className = 'memorial-slideshow';
  memorialContainer.appendChild(slideshowContainer);
  
  // Find a good insertion point and insert our container
  const targetElement = hideOriginalFeed();
  if (targetElement) {
    targetElement.prepend(memorialContainer);
  } else {
    // Fallback to body if no better target found
    document.body.prepend(memorialContainer);
  }

  // Return the created elements for testing purposes
  return {
    container: memorialContainer,
    slideshow: slideshowContainer
  };
}

// Start the slideshow rotating through the fallen records
function startSlideshow() {
  // If we have an existing interval, clear it
  if (slideInterval) {
    clearInterval(slideInterval);
  }
  
  // Show the first image immediately
  showSlide(currentIndex);
  
  // Set up a timer to change images every 3 seconds
  slideInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % displayQueue.length;
    
    // If we're near the end of our display queue, try to fetch more
    if (currentIndex >= displayQueue.length - 3) {
      preloadNextImages();
    }
    
    showSlide(currentIndex);
  }, 3000);
}

// Display a specific slide
function showSlide(index) {
  const record = displayQueue[index];
  const slideshowContainer = document.getElementById('memorial-slideshow');
  
  if (!slideshowContainer || !record) return;
  
  // Create image URL from path
  const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/fallen-images/${record.image_path}`;
  
  // Create the new slide
  const slideElement = document.createElement('div');
  slideElement.className = 'memorial-slide memorial-fade';
  slideElement.style.opacity = '0';
  
  // Add the image - use preloaded image if available
  const imageElement = new Image();
  if (preloadedImages[imageUrl]) {
    console.log(`Using preloaded image for ${record.name}`);
    // Clone the preloaded image to avoid issues with reusing the same element
    imageElement.src = preloadedImages[imageUrl].src;
  } else {
    console.log(`No preloaded image for ${record.name}, loading directly`);
    imageElement.src = imageUrl;
  }
  
  imageElement.alt = record.name;
  imageElement.className = 'memorial-image';
  slideElement.appendChild(imageElement);
  
  // Add the name
  const nameElement = document.createElement('h2');
  nameElement.textContent = record.name;
  nameElement.className = 'memorial-name';
  slideElement.appendChild(nameElement);
  
  // Replace existing slide or add the first one
  if (slideshowContainer.childElementCount > 0) {
    const currentSlide = slideshowContainer.firstChild;
    
    // Add the new slide with opacity 0
    slideshowContainer.appendChild(slideElement);
    
    // Trigger fade in for new slide
    setTimeout(() => {
      slideElement.style.opacity = '1';
      // Fade out the old slide
      currentSlide.style.opacity = '0';
      
      // After transition completes, remove the old slide
      setTimeout(() => {
        slideshowContainer.removeChild(currentSlide);
      }, 1000); // Match the CSS transition duration
    }, 50);
  } else {
    // First slide, just show it
    slideshowContainer.appendChild(slideElement);
    
    // Trigger fade in
    setTimeout(() => {
      slideElement.style.opacity = '1';
    }, 50);
  }
  
  // Preload next images after showing a slide
  preloadNextImages();
}

// For early loading on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing immediately');
    initMemorialFeed();
  });
} else {
  console.log('Document already loaded, initializing immediately');
  initMemorialFeed();
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
    
    // Force reinitialize
    initMemorialFeed();
  }
  
  // Return true to indicate async response
  return true;
}); 