// Save options to Chrome storage
function saveOptions() {
  const enableOutsideMemorialDay = document.getElementById('enable-outside-memorial-day').checked;
  
  chrome.storage.sync.set(
    {
      forceEnabled: enableOutsideMemorialDay
    },
    function() {
      // Update status to let user know options were saved
      const status = document.getElementById('status');
      status.textContent = 'ההגדרות נשמרו בהצלחה';
      
      setTimeout(function() {
        status.textContent = '';
      }, 3000);
    }
  );
}

// Restore saved options when options page is loaded
function restoreOptions() {
  chrome.storage.sync.get(
    {
      // Default values
      forceEnabled: false
    },
    function(items) {
      document.getElementById('enable-outside-memorial-day').checked = items.forceEnabled;
    }
  );
}

// Event listeners
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save-button').addEventListener('click', saveOptions); 