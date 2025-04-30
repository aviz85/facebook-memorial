// Background script for Facebook Memorial Feed Extension
console.log('Facebook Memorial Feed background script loaded');

// Listen for installation events
chrome.runtime.onInstalled.addListener(() => {
  console.log('Facebook Memorial Feed extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    forceEnabled: true,  // Enable by default for testing
  }, function() {
    console.log('Default settings initialized');
  });
});

// Listen for tab updates to ensure content script is injected
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only act on Facebook urls
  if (tab.url && tab.url.includes('facebook.com')) {
    console.log('Facebook page detected in tab', tabId);
    
    if (changeInfo.status === 'complete') {
      console.log('Tab fully loaded, checking extension status');
      
      // Show a notification that the extension is active
      chrome.tabs.sendMessage(tabId, { action: "checkStatus" }, function(response) {
        if (!response) {
          console.log('No response from content script, it might not be running');
        } else {
          console.log('Content script responded:', response);
        }
      });
    }
  }
}); 