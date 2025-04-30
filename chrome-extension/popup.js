// Runs when popup is opened
document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('status');
  const enableCheckbox = document.getElementById('enable-outside-memorial-day');
  const refreshButton = document.getElementById('refresh-button');
  
  // Add debug element to popup
  const debugElement = document.createElement('div');
  debugElement.innerHTML = `
    <hr>
    <div>
      <h3 style="margin-top: 5px; font-size: 14px;">אפשרויות נוספות:</h3>
      <button id="show-logs" style="margin-top: 5px; background-color: #4267B2; color: white; border: none; padding: 5px 10px; border-radius: 4px; width: 100%;">צפה בלוגים</button>
      <button id="refresh-page" style="margin-top: 5px; background-color: #4267B2; color: white; border: none; padding: 5px 10px; border-radius: 4px; width: 100%;">רענן דף מלא</button>
    </div>
  `;
  document.body.appendChild(debugElement);
  
  // Setup debug log button
  document.getElementById('show-logs').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // Execute script to open console in the current tab
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: function() {
          console.log('%c=============== FACEBOOK MEMORIAL LOGS ===============', 'color: #4267B2; font-weight: bold; font-size: 14px;');
          console.log('Check the logs above for debugging information');
          // This will typically open the console automatically on most browsers
          console.log('Right-click on page > Inspect > Console to see more logs');
          console.log('%c===================================================', 'color: #4267B2; font-weight: bold; font-size: 14px;');
        }
      });
    });
  });
  
  // Setup page refresh button
  document.getElementById('refresh-page').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.reload(tabs[0].id);
      window.close();
    });
  });
  
  // Load saved settings
  chrome.storage.sync.get(['forceEnabled'], function(result) {
    enableCheckbox.checked = result.forceEnabled === true;
  });
  
  // Function to force execute the content script
  function forceExecuteContentScript(tabId) {
    // First try to communicate with existing content script
    chrome.tabs.sendMessage(tabId, { action: 'checkStatus' }, function(response) {
      if (chrome.runtime.lastError || !response) {
        statusElement.textContent = 'סטטוס: מפעיל את התוסף...';
        statusElement.style.backgroundColor = '#fff8e1';
        
        // No response, so try to force execute the script
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          function: function() {
            // This will be executed directly in the page
            console.log('Force executing Facebook Memorial Feed content script');
            // Send a message to the background to reload content script
            if (chrome.runtime) {
              chrome.runtime.sendMessage({ action: 'forceReloadContentScript' });
            }
            
            // Try to trigger the content script directly from the page
            const event = new CustomEvent('facebookMemorialFeedActivate', { detail: { forced: true } });
            document.dispatchEvent(event);
          }
        }, function() {
          if (chrome.runtime.lastError) {
            statusElement.textContent = 'סטטוס: שגיאה בהפעלה, נסה לרענן את הדף';
            statusElement.style.backgroundColor = '#ffebee';
          } else {
            statusElement.textContent = 'סטטוס: התוסף הופעל - בדוק את הדף';
            statusElement.style.backgroundColor = '#e8f5e9';
          }
        });
      } else if (response && response.status === 'active') {
        statusElement.textContent = 'סטטוס: פעיל - התוסף פועל כעת';
        statusElement.style.backgroundColor = '#e8f5e9';
      }
    });
  }
  
  // Check if we're on Facebook
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('facebook.com')) {
      statusElement.textContent = 'סטטוס: מוכן - אתה נמצא בפייסבוק';
      statusElement.style.backgroundColor = '#e6f7ff';
      
      // Try to force execute immediately
      forceExecuteContentScript(tabs[0].id);
    } else {
      statusElement.textContent = 'סטטוס: לא פעיל - לא בפייסבוק';
      statusElement.style.backgroundColor = '#ffebee';
    }
  });
  
  // Handle checkbox change
  enableCheckbox.addEventListener('change', function() {
    chrome.storage.sync.set({ forceEnabled: this.checked }, function() {
      console.log('Force enable setting saved:', enableCheckbox.checked);
    });
  });
  
  // Handle refresh button click
  refreshButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('facebook.com')) {
        // First try messaging the content script
        statusElement.textContent = 'סטטוס: מנסה להפעיל...';
        statusElement.style.backgroundColor = '#fff8e1';
        
        // Try force executing
        forceExecuteContentScript(tabs[0].id);
      }
    });
  });
}); 