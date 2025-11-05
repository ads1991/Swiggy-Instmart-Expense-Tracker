// Check login status and display UI
async function checkLoginStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkLogin' });
    displayStatus(response);
  } catch (error) {
    console.error('Error checking login status:', error);
    displayStatus({ isLoggedIn: false, error: true });
  }
}

function displayStatus(data) {
  const contentDiv = document.getElementById('content');

  if (data.isLoggedIn) {
    contentDiv.innerHTML = `
      <div class="status-card">
        <div class="status-indicator">
          <div class="status-dot online"></div>
          <span class="status-text">Logged in to Swiggy</span>
        </div>
        <p style="font-size: 12px; opacity: 0.9;">Ready to extract your orders!</p>
      </div>

      <button class="button" id="extractBtn">
        📊 View Analytics Dashboard
      </button>

      <p class="info-text">
        Click to analyze your expenses
      </p>
    `;

    document.getElementById('extractBtn').addEventListener('click', extractAndRedirect);
  } else {
    contentDiv.innerHTML = `
      <div class="status-card">
        <div class="status-indicator">
          <div class="status-dot offline"></div>
          <span class="status-text">Not logged in</span>
        </div>
        <p style="font-size: 12px; opacity: 0.9;">Please log in to Swiggy first</p>
      </div>

      <button class="button" id="loginBtn">
        🔐 Go to Swiggy Login
      </button>

      <p class="info-text">
        Log in to start tracking expenses
      </p>
    `;

    document.getElementById('loginBtn').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://www.swiggy.com' });
    });
  }
}

async function extractAndRedirect() {
  const button = document.getElementById('extractBtn');
  button.disabled = true;
  button.textContent = '⏳ Extracting data...';

  try {
    // Send message to background script to extract orders
    const response = await chrome.runtime.sendMessage({ action: 'extractOrders' });

    console.log('Extract response:', response);

    if (response && response.success) {
      console.log('Orders extracted successfully!');
      console.log('Total orders:', response.data.orders?.length || 0);
      console.log('Data source:', response.data.source);

      // Store in Chrome storage
      await chrome.storage.local.set({ ordersData: response.data });

      // Open React app with data passed via URL hash
      const dataString = encodeURIComponent(JSON.stringify(response.data));
      const appUrl = `http://adhishree.tech/swiggy-expense/#data=${dataString}`;

      chrome.tabs.create({ url: appUrl });

      button.textContent = '✅ Opening dashboard...';
    } else {
      throw new Error(response?.error || 'Failed to extract orders');
    }
  } catch (error) {
    console.error('Error extracting orders:', error);
    button.textContent = `❌ ${error.message}`;
    setTimeout(() => {
      button.disabled = false;
      button.textContent = '📊 View Analytics Dashboard';
    }, 3000);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', checkLoginStatus);
