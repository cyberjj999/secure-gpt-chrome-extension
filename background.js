// SecureGPT Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('SecureGPT extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    secureGptSettings: {
      enabled: true,
      showNotifications: true,
      autoScan: true,
      patterns: {
        email: true,
        phone: true,
        ssn: true,
        creditCard: true,
        apiKey: true,
        ipAddress: true,
        bankAccount: true,
        passport: true,
        address: true
      }
    }
  });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSettings':
      chrome.storage.sync.get(['secureGptSettings'], (result) => {
        sendResponse(result.secureGptSettings || {});
      });
      return true; // Keep message channel open for async response
      
    case 'saveSettings':
      chrome.storage.sync.set({ secureGptSettings: request.settings }, () => {
        sendResponse({ success: true });
        
        // Notify all ChatGPT tabs to reload
        chrome.tabs.query({ url: ['*://chat.openai.com/*', '*://chatgpt.com/*'] }, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: 'updateSettings' });
          });
        });
      });
      return true;
      
    case 'getStats':
      // Future feature: return statistics about blocked content
      sendResponse({ blocked: 0 });
      return true;
  }
});

// Update badge when extension is active on ChatGPT
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com')) {
      chrome.action.setBadgeText({
        text: '🛡️',
        tabId: tabId
      });
      chrome.action.setBadgeBackgroundColor({
        color: '#4CAF50',
        tabId: tabId
      });
    } else {
      chrome.action.setBadgeText({
        text: '',
        tabId: tabId
      });
    }
  }
});

// Clear badge when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.action.setBadgeText({
    text: '',
    tabId: tabId
  });
});
