// Configuration file for Facebook Memorial Extension

// Export configuration values
export const config = {
  // Supabase credentials
  SUPABASE_URL: 'https://nuepjimdxzybberqffds.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZXBqaW1keHp5YmJlcnFmZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5OTMyMTksImV4cCI6MjA2MTU2OTIxOX0.JI-XONtQgrTTJPdli01Ot84r1JwtYNSWodjflNzdwCU',
  
  // Slideshow settings
  SLIDE_DURATION_MS: 3000, // Time each slide stays visible (3 seconds)
  TRANSITION_DURATION_MS: 1000, // Fade transition duration (1 second)
  
  // Feature flags
  ENABLE_OUTSIDE_MEMORIAL_DAY: false, // Set to true to test outside of Memorial Day
  
  // Memorial Day settings - default dates for testing
  // Actual implementation should use a Hebrew calendar library
  MEMORIAL_DAY_MONTH: 3, // April (0-based month)
  MEMORIAL_DAY_DATES: [13, 14], // Approximate dates for testing
};

// Allow importing in browser extensions
if (typeof window !== 'undefined') {
  window.MemorialConfig = config;
} 