// Content script that runs on Swiggy pages
// This can be used to monitor login status or extract data directly

console.log('Swiggy Expense Tracker extension loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageData') {
    const pageData = extractPageData();
    sendResponse({ success: true, data: pageData });
  }
  return true;
});

// Extract data from current page
function extractPageData() {
  return {
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString()
  };
}

// Monitor for login/logout events
function monitorAuthState() {
  // Check if user info is present on the page
  const userElements = document.querySelectorAll('[class*="user"], [class*="profile"], [class*="account"]');

  if (userElements.length > 0) {
    chrome.runtime.sendMessage({
      action: 'authStateChanged',
      isLoggedIn: true
    });
  }
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', monitorAuthState);
} else {
  monitorAuthState();
}
