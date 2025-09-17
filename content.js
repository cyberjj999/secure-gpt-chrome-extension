// SecureGPT Content Script
// Intercepts and sanitizes user input in ChatGPT

class SecureGPT {
  constructor() {
    this.patterns = {
      email: {
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi,
        placeholder: '[EMAIL_REDACTED]'
      },
      phone: {
        regex: /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
        placeholder: '[PHONE_REDACTED]'
      },
      ssn: {
        regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        placeholder: '[SSN_REDACTED]'
      },
      creditCard: {
        regex: /\b(?:\d[ -]*?){13,19}\b/g,
        placeholder: '[CREDIT_CARD_REDACTED]'
      },
      apiKey: {
        regex: /\b[A-Za-z0-9]{20,}\b/g,
        placeholder: '[API_KEY_REDACTED]'
      },
      ipAddress: {
        regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        placeholder: '[IP_ADDRESS_REDACTED]'
      },
      bankAccount: {
        regex: /\b\d{8,17}\b/g,
        placeholder: '[ACCOUNT_NUMBER_REDACTED]'
      },
      passport: {
        regex: /\b[A-Z]{1,2}\d{6,9}\b/g,
        placeholder: '[PASSPORT_REDACTED]'
      },
      address: {
        regex: /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way)\b/gi,
        placeholder: '[ADDRESS_REDACTED]'
      }
    };
    
    this.settings = {
      enabled: true,
      showNotifications: true,
      patterns: Object.keys(this.patterns).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    };
    
    this.init();
  }

  async init() {
    // Load settings from storage
    try {
      const stored = await chrome.storage.sync.get(['secureGptSettings']);
      if (stored.secureGptSettings) {
        this.settings = { ...this.settings, ...stored.secureGptSettings };
      }
    } catch (error) {
      console.log('SecureGPT: Using default settings');
    }

    this.setupEventListeners();
    this.injectScript();
  }

  setupEventListeners() {
    // Listen for paste events on textareas
    document.addEventListener('paste', (event) => {
      if (!this.settings.enabled) return;
      
      if (this.isTargetTextarea(event.target)) {
        setTimeout(() => {
          this.scanAndReplace();
        }, 100);
      }
    });

    // Listen for input changes on textareas
    document.addEventListener('input', (event) => {
      if (!this.settings.enabled) return;
      
      if (this.isTargetTextarea(event.target)) {
        this.debounce(() => {
          this.scanAndReplace();
        }, 1000)();
      }
    });

    // Listen for form submissions
    document.addEventListener('submit', (event) => {
      if (!this.settings.enabled) return;
      
      const form = event.target;
      if (this.isChatGPTForm(form)) {
        this.scanAndReplace();
      }
    });
  }

  injectScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  isTargetTextarea(element) {
    if (!element || element.tagName !== 'TEXTAREA') return false;
    
    // Check if it's a ChatGPT input textarea
    const parent = element.closest('[data-testid*="chat"], [class*="chat"], [id*="chat"]');
    const isChatGPTTextarea = parent !== null || 
           element.placeholder?.toLowerCase().includes('message') ||
           element.getAttribute('aria-label')?.toLowerCase().includes('message') ||
           element.getAttribute('data-id')?.includes('prompt-textarea') ||
           element.id?.includes('prompt-textarea');
    
    return isChatGPTTextarea;
  }

  isChatGPTForm(form) {
    return form.querySelector('textarea') && 
           (form.querySelector('[data-testid*="send"]') || 
            form.querySelector('button[type="submit"]'));
  }

  scanAndReplace() {
    const textareas = document.querySelectorAll('textarea');
    
    textareas.forEach(textarea => {
      if (this.isTargetTextarea(textarea)) {
        const originalValue = textarea.value;
        const sanitizedValue = this.sanitizeText(originalValue);
        
        if (originalValue !== sanitizedValue) {
          textarea.value = sanitizedValue;
          
          // Trigger input event to notify React/Vue about the change
          const event = new Event('input', { bubbles: true });
          textarea.dispatchEvent(event);
          
          if (this.settings.showNotifications) {
            this.showNotification('Sensitive information detected and replaced with placeholders');
          }
        }
      }
    });
  }

  sanitizeText(text) {
    let sanitized = text;
    let replacementCount = 0;

    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      if (this.settings.patterns[patternName]) {
        const matches = sanitized.match(pattern.regex);
        if (matches) {
          sanitized = sanitized.replace(pattern.regex, pattern.placeholder);
          replacementCount += matches.length;
        }
      }
    }

    return sanitized;
  }

  showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 300px;
    `;
    notification.textContent = `SecureGPT: ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize SecureGPT when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SecureGPT();
  });
} else {
  new SecureGPT();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    // Reload the page to apply new settings
    window.location.reload();
  }
});
