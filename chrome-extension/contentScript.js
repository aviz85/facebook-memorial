console.log('Facebook Memorial Feed extension loaded!');

// Configuration - Supabase credentials
const SUPABASE_URL = 'https://nuepjimdxzybberqffds.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZXBqaW1keHp5YmJlcnFmZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5OTMyMTksImV4cCI6MjA2MTU2OTIxOX0.JI-XONtQgrTTJPdli01Ot84r1JwtYNSWodjflNzdwCU';

// Global variables
let fallenRecords = [];
let currentIndex = 0;
let slideInterval = null;

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
    
    // Instead of dynamic import, use fetch directly
    try {
      // Fetch data using normal fetch API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/fallen?approved=eq.true&select=name,image_path&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('No approved records found');
      }
      
      fallenRecords = data;
      console.log(`Loaded ${fallenRecords.length} fallen records`);
      
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
    currentIndex = (currentIndex + 1) % fallenRecords.length;
    showSlide(currentIndex);
  }, 3000);
}

// Display a specific slide
function showSlide(index) {
  const record = fallenRecords[index];
  const slideshowContainer = document.getElementById('memorial-slideshow');
  
  if (!slideshowContainer || !record) return;
  
  // Create image URL from path
  const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/fallen-images/${record.image_path}`;
  
  // Create the new slide
  const slideElement = document.createElement('div');
  slideElement.className = 'memorial-slide memorial-fade';
  slideElement.style.opacity = '0';
  
  // Add the image
  const imageElement = document.createElement('img');
  imageElement.src = imageUrl;
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