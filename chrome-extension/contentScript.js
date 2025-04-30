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
    
    // Check if it's Israel Memorial Day (can be removed for testing)
    if (!isMemorialDay() && !isExtensionForceEnabled()) {
      console.log('Not Memorial Day and extension not forced, exiting');
      return;
    }
    
    // Import Supabase client from CDN
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    
    // Fetch approved records from Supabase
    const { data, error } = await supabase
      .from('fallen')
      .select('name,image_path')
      .eq('approved', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error('Failed to fetch data: ' + error.message);
    }
    
    if (!data || data.length === 0) {
      throw new Error('No approved records found');
    }
    
    fallenRecords = data;
    console.log(`Loaded ${fallenRecords.length} fallen records`);
    
    // Hide Facebook feed and inject memorial feed
    hideOriginalFeed();
    injectMemorialFeed();
    startSlideshow();
    
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
  // Default to disabled - user must enable explicitly for testing outside Memorial Day
  let isEnabled = false;
  
  // In a real implementation, we'd check chrome.storage
  // This synchronous check is just a placeholder - you'd need to make it async in real code
  chrome.storage.sync.get(['forceEnabled'], (result) => {
    isEnabled = result.forceEnabled === true;
  });
  
  return isEnabled;
}

// Hide the original Facebook feed
function hideOriginalFeed() {
  // Primary candidates to hide
  const feedSelectors = [
    'div[role="feed"]',                // Main feed
    '[data-pagelet="FeedUnit"]',       // Feed units
    '#stream_pagelet',                 // Old style stream
    '[data-pagelet="Stories"]',        // Stories at top
    '.x1lliihq'                        // Common class for feed items
  ];
  
  // Try to find and hide feed elements
  for (const selector of feedSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      element.style.display = 'none';
    }
  }
  
  // Find a good insertion point
  return document.querySelector('[role="main"]') || document.body;
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

// Run once the page is fully loaded
window.addEventListener('load', () => {
  // Small delay to ensure Facebook's content is loaded
  setTimeout(initMemorialFeed, 1000);
});

// Run if the page was already loaded
if (document.readyState === 'complete') {
  setTimeout(initMemorialFeed, 1000);
} 