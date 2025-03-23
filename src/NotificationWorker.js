// NotificationWorker.js
let checkInterval;

self.onmessage = function(e) {
  if (e.data.action === 'start') {
    // Clear any existing interval
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    
    // Start a new interval that posts a message every hour
    const interval = e.data.interval || 3600000; // Default to 1 hour
    checkInterval = setInterval(() => {
      self.postMessage({ type: 'check_notifications' });
    }, interval);
    
    // Also trigger an immediate check
    self.postMessage({ type: 'check_notifications' });
    
  } else if (e.data.action === 'stop') {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }
};