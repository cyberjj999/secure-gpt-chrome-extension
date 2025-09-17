// SecureGPT Content Script - ChatGPT ContentEditable Version
// Works with ChatGPT's ProseMirror contenteditable div

class SecureGPTSimple {
  constructor() {
    this.patterns = {
      // Credit card patterns (check first to avoid conflicts)
      creditCard: {
        regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
        placeholder: '[CREDIT_CARD_REDACTED]'
      },
      // More specific credit card pattern for 13-19 digits
      creditCardGeneric: {
        regex: /\b\d{13,19}\b/g,
        placeholder: '[CREDIT_CARD_REDACTED]'
      },
      email: {
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi,
        placeholder: '[EMAIL_REDACTED]'
      },
      // More specific phone number patterns
      phone: {
        regex: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
        placeholder: '[PHONE_REDACTED]'
      },
      // International phone numbers
      phoneInternational: {
        regex: /\+[1-9]\d{1,14}\b/g,
        placeholder: '[PHONE_REDACTED]'
      },
      ssn: {
        regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        placeholder: '[SSN_REDACTED]'
      },
      apiKey: {
        regex: /\b[A-Za-z0-9]{20,}\b/g,
        placeholder: '[API_KEY_REDACTED]'
      },
      ipAddress: {
        regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
        placeholder: '[IP_ADDRESS_REDACTED]'
      },
      // More specific bank account (avoid credit card conflicts)
      bankAccount: {
        regex: /\b(?:account|acct|routing)[\s#:]*\d{8,17}\b/gi,
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
      autoScan: true,
      patterns: Object.keys(this.patterns).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {})
    };
    
    this.currentPromptDiv = null;
    this.dePiiButton = null;
    
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
  }

  setupEventListeners() {
    // Use MutationObserver to watch for ChatGPT prompt div changes
    this.observer = new MutationObserver((mutations) => {
      if (!this.settings.enabled) return;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Look for the prompt textarea div
              const promptDiv = node.querySelector ? node.querySelector('#prompt-textarea') : null;
              if (promptDiv || (node.id === 'prompt-textarea')) {
                this.attachToPromptDiv(promptDiv || node);
              }
              
              // Also check if send button area is added to inject our De-PII button
              this.injectDePiiButton();
            }
          });
        }
      });
    });

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check existing elements
    this.checkExistingElements();
  }

  checkExistingElements() {
    // Look for existing prompt div
    const promptDiv = document.querySelector('#prompt-textarea');
    if (promptDiv) {
      this.attachToPromptDiv(promptDiv);
    }
    
    // Inject De-PII button
    this.injectDePiiButton();
  }

  attachToPromptDiv(promptDiv) {
    if (promptDiv.secureGptAttached) return;
    promptDiv.secureGptAttached = true;
    this.currentPromptDiv = promptDiv;

    // Listen for input events on contenteditable div
    promptDiv.addEventListener('input', (event) => {
      if (!this.settings.enabled || !this.settings.autoScan) return;
      this.debounce(() => {
        this.scanPromptDiv(promptDiv);
      }, 1500)();
    });

    // Listen for paste events
    promptDiv.addEventListener('paste', (event) => {
      if (!this.settings.enabled || !this.settings.autoScan) return;
      setTimeout(() => {
        this.scanPromptDiv(promptDiv);
      }, 100);
    });

    // Listen for keydown to catch Enter key
    promptDiv.addEventListener('keydown', (event) => {
      if (!this.settings.enabled) return;
      
      // Catch Enter key (send message)
      if (event.key === 'Enter' && !event.shiftKey) {
        this.scanPromptDiv(promptDiv);
      }
    });
  }

  scanPromptDiv(promptDiv) {
    // Store current selection/cursor position
    const selection = window.getSelection();
    let cursorNode = null;
    let cursorOffset = 0;
    let hasSelection = false;
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorNode = range.startContainer;
      cursorOffset = range.startOffset;
      hasSelection = true;
    }
    
    const walker = document.createTreeWalker(
      promptDiv,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let hasChanges = false;
    const textNodes = [];
    let nodeIndex = 0;
    let cursorNodeIndex = -1;
    
    // Collect all text nodes and find cursor position
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
      if (hasSelection && node === cursorNode) {
        cursorNodeIndex = nodeIndex;
      }
      nodeIndex++;
    }
    
    // Process each text node
    textNodes.forEach((textNode, index) => {
      const originalText = textNode.textContent;
      const sanitizedText = this.sanitizeText(originalText);
      
      if (originalText !== sanitizedText) {
        // Calculate cursor position adjustment
        let cursorAdjustment = 0;
        if (hasSelection && index === cursorNodeIndex) {
          // Calculate how much the text length changed
          cursorAdjustment = sanitizedText.length - originalText.length;
        }
        
        textNode.textContent = sanitizedText;
        hasChanges = true;
        
        // Update cursor offset if this was the cursor node
        if (hasSelection && index === cursorNodeIndex) {
          cursorOffset = Math.max(0, cursorOffset + cursorAdjustment);
        }
      }
    });
    
    if (hasChanges) {
      // Restore cursor position
      if (hasSelection && cursorNodeIndex >= 0 && textNodes[cursorNodeIndex]) {
        try {
          const range = document.createRange();
          range.setStart(textNodes[cursorNodeIndex], Math.min(cursorOffset, textNodes[cursorNodeIndex].textContent.length));
          range.collapse(true);
          
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // If cursor restoration fails, place cursor at end
          const range = document.createRange();
          range.selectNodeContents(promptDiv);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      
      // Trigger input event to notify the application
      const event = new Event('input', { bubbles: true });
      promptDiv.dispatchEvent(event);
      
      if (this.settings.showNotifications) {
        this.showNotification('Sensitive information detected and replaced with placeholders');
      }
    }
  }

  injectDePiiButton() {
    // Don't inject if already exists or extension is disabled
    if (this.dePiiButton || !this.settings.enabled) return;
    
    // Look for the send button area
    const sendButton = document.querySelector('[data-testid="send-button"]') || 
                      document.querySelector('button[aria-label*="Send"]') ||
                      document.querySelector('button svg[class*="send"]')?.closest('button');
    
    if (!sendButton) return;
    
    // Create De-PII button
    this.dePiiButton = document.createElement('button');
    this.dePiiButton.innerHTML = '<img src="' + chrome.runtime.getURL('icons/icon16.png') + '" width="16" height="16">';
    this.dePiiButton.title = 'De-PII: Remove sensitive information';
    this.dePiiButton.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 16px;
      margin-right: 8px;
      padding: 8px;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
      font-weight: 500;
    `;
    
    // Hover effect
    this.dePiiButton.addEventListener('mouseenter', () => {
      this.dePiiButton.style.background = 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)';
      this.dePiiButton.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.3)';
    });
    this.dePiiButton.addEventListener('mouseleave', () => {
      this.dePiiButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      this.dePiiButton.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.2)';
    });
    
    // Click handler
    this.dePiiButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.manualDePii();
    });
    
    // Insert before send button
    sendButton.parentNode.insertBefore(this.dePiiButton, sendButton);
  }

  manualDePii() {
    const promptDiv = document.querySelector('#prompt-textarea');
    if (!promptDiv) {
      this.showNotification('Could not find input area');
      return;
    }
    
    // Check if there's sensitive data before processing
    const currentText = promptDiv.textContent || '';
    const hasSensitiveData = Object.values(this.patterns).some(pattern => 
      pattern.regex.test(currentText)
    );
    
    if (!hasSensitiveData) {
      this.showNotification('No sensitive information detected');
      return;
    }
    
    // Use the same text node processing as auto-scan (with cursor preservation)
    this.scanPromptDiv(promptDiv);
    
    this.showNotification('Sensitive information removed!');
    
      // Visual feedback on button
      const originalButtonText = this.dePiiButton.innerHTML;
      this.dePiiButton.innerHTML = '<img src="' + chrome.runtime.getURL('icons/icon16.png') + '" width="16" height="16">';
      this.dePiiButton.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
      
      setTimeout(() => {
        this.dePiiButton.innerHTML = originalButtonText;
        this.dePiiButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }, 1500);
  }

  sanitizeText(text) {
    let sanitized = text;
    let replacementCount = 0;

    // Process patterns in order of specificity (most specific first)
    const patternOrder = [
      'creditCard',           // Most specific credit card patterns first
      'creditCardGeneric',    // Generic credit card patterns
      'email',               // Email addresses
      'phoneInternational',   // International phone numbers
      'phone',               // US phone numbers
      'ssn',                 // Social Security Numbers
      'apiKey',              // API keys
      'ipAddress',           // IP addresses
      'bankAccount',         // Bank account numbers (with context)
      'passport',            // Passport numbers
      'address'              // Street addresses
    ];

    for (const patternName of patternOrder) {
      if (this.settings.patterns[patternName] && this.patterns[patternName]) {
        const pattern = this.patterns[patternName];
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
    new SecureGPTSimple();
  });
} else {
  new SecureGPTSimple();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    // Reload the page to apply new settings
    window.location.reload();
  }
});
