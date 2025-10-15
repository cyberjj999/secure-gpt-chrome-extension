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
      }, {}),
      customPatterns: {
        hardcodedStrings: [],
        regexPatterns: []
      }
    };
    
    this.currentPromptDiv = null;
    this.dePiiButton = null;
    this.buttonHost = null;
    this.fileInput = null;
    this.attachedElements = new WeakSet();
    this.observers = new Map();
    
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

    // Check if protection is enabled for this website
    if (!this.isWebsiteEnabled()) {
      return;
    }

    // First, investigate the real DOM structure
    this.investigateRealDOM();

    this.setupEventListeners();
    this.setupDebugging();
    
    // Only create floating button if extension is enabled
    if (this.settings.enabled) {
      this.createFloatingFallback();
    }
  }

  isWebsiteEnabled() {
    const hostname = window.location.hostname;
    const websites = this.settings.websites || {};
    
    // Check if any website is enabled for this hostname
    if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
      return websites.chatgpt !== false;
    }
    if (hostname.includes('claude.ai')) {
      return websites.claude !== false;
    }
    if (hostname.includes('gemini.google.com')) {
      return websites.gemini !== false;
    }
    if (hostname.includes('ai.meta.com')) {
      return websites.llama !== false;
    }
    if (hostname.includes('mistral.ai')) {
      return websites.mistral !== false;
    }
    if (hostname.includes('x.ai')) {
      return websites.grok !== false;
    }
    if (hostname.includes('cohere.com')) {
      return websites.cohere !== false;
    }
    if (hostname.includes('perplexity.ai')) {
      return websites.perplexity !== false;
    }
    if (hostname.includes('chat.deepseek.com')) {
      return websites.deepseek !== false;
    }
    
    // Default to enabled for unknown sites
    return true;
  }

  setupEventListeners() {
    // Use MutationObserver to watch for ChatGPT prompt div changes
    this.observer = new MutationObserver((mutations) => {
      if (!this.settings.enabled) return;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Look for various AI input elements
              const selectors = [
                // ChatGPT specific
                '#prompt-textarea',
                // Textarea patterns
                'textarea[placeholder*="message" i]',
                'textarea[placeholder*="ask" i]',
                'textarea[placeholder*="prompt" i]',
                'textarea[aria-label*="message" i]',
                'textarea[aria-label*="prompt" i]',
                'textarea[id*="input"]',
                'textarea[id*="message"]',
                'textarea[class*="prompt"]',
                'textarea[class*="input"]',
                'textarea[class*="message"]',
                // ContentEditable patterns
                'div[contenteditable="true"]',
                'div[role="textbox"]',
                'div[class*="prompt" i]',
                'div[class*="input" i]',
                'div[class*="message" i]',
                'div[class*="textbox" i]',
                'div[class*="textarea" i]',
                'div[id*="prompt"]',
                'div[id*="input"]',
                'div[id*="message"]',
                // Data attributes (React patterns)
                '[data-testid*="prompt"]',
                '[data-testid*="input"]',
                '[data-testid*="textarea"]',
                '[data-testid*="message"]',
                '[data-testid*="textbox"]',
                '[data-cy*="prompt"]',
                '[data-cy*="input"]',
                '[data-cy*="textarea"]',
                '[data-cy*="message"]',
                '[data-cy*="textbox"]',
                // Aria and placeholder patterns
                'div[aria-label*="message" i]',
                'div[aria-label*="input" i]',
                'div[aria-label*="prompt" i]',
                'div[placeholder*="message" i]',
                'div[placeholder*="ask" i]',
                'div[placeholder*="prompt" i]'
              ];
              
              let foundElement = null;
              for (const selector of selectors) {
                const element = node.querySelector ? node.querySelector(selector) : null;
                if (element || (node.matches && node.matches(selector))) {
                  foundElement = element || node;
                  break;
                }
              }
              
              if (foundElement) {
                console.log('🔍 SecureGPT: MutationObserver found element:', foundElement);
                console.log('📋 SecureGPT: Element details:', {
                  tagName: foundElement.tagName,
                  id: foundElement.id,
                  className: foundElement.className,
                  placeholder: foundElement.placeholder,
                  role: foundElement.getAttribute('role'),
                  contenteditable: foundElement.getAttribute('contenteditable'),
                  dataTestId: foundElement.getAttribute('data-testid'),
                  dataCy: foundElement.getAttribute('data-cy'),
                  ariaLabel: foundElement.getAttribute('aria-label'),
                  rect: foundElement.getBoundingClientRect(),
                  isVisible: this.isVisible(foundElement),
                  parentElement: foundElement.parentElement ? {
                    tagName: foundElement.parentElement.tagName,
                    className: foundElement.parentElement.className,
                    id: foundElement.parentElement.id
                  } : null
                });
                this.attachToPromptDiv(foundElement);
              }
              
              // Also check if send button area is added to inject our De-PII button
              // COMMENTED OUT: Only using bottom-right floating button for simplicity
              // this.injectDePiiButton();
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
    console.log('SecureGPT: Checking existing elements on page');
    
    // Use improved element detection with scoring
    const targetElement = this.findTargetElement();
    console.log('SecureGPT: checkExistingElements - targetElement:', targetElement);

    if (targetElement) {
      console.log('SecureGPT: Found target element:', targetElement);
      console.log('SecureGPT: Element details:', {
        tagName: targetElement.tagName,
        id: targetElement.id,
        className: targetElement.className,
        placeholder: targetElement.placeholder,
        role: targetElement.getAttribute('role'),
        contenteditable: targetElement.getAttribute('contenteditable'),
        dataTestId: targetElement.getAttribute('data-testid'),
        dataCy: targetElement.getAttribute('data-cy')
      });
      this.attachToPromptDiv(targetElement);
    } else {
      console.log('SecureGPT: No target element found');
    }
    
    // Inject De-PII button
    console.log('SecureGPT: Attempting to inject De-PII button');
    // COMMENTED OUT: Only using bottom-right floating button for simplicity
    // this.injectDePiiButton();
  }

  findInputElements() {
    const selectors = [
      'textarea[placeholder*="message" i]',
      'div[contenteditable="true"]',
      'div[role="textbox"]',
      'textarea[id*="prompt"]',
      'textarea[id*="input"]',
      'textarea[placeholder*="ask" i]',
      'textarea[placeholder*="prompt" i]',
      'textarea[aria-label*="message" i]',
      'textarea[aria-label*="prompt" i]',
      'textarea[class*="prompt"]',
      'textarea[class*="input"]',
      'textarea[class*="message"]',
      // Data attribute selectors
      '[data-testid*="prompt"]',
      '[data-testid*="input"]',
      '[data-testid*="textarea"]',
      '[data-testid*="message"]',
      '[data-cy*="prompt"]',
      '[data-cy*="input"]',
      '[data-cy*="textarea"]',
      '[data-cy*="message"]'
    ];
    
    const candidates = document.querySelectorAll(selectors.join(','));
    return Array.from(candidates).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 200 && rect.height > 30;
    });
  }

  scoreElement(element) {
    let score = 0;
    const rect = element.getBoundingClientRect();
    
    // Size scoring
    if (rect.width > 300) score += 2;
    if (rect.height > 50) score += 2;
    
    // Type scoring
    if (element.tagName === 'TEXTAREA') score += 1;
    if (element.getAttribute('role') === 'textbox') score += 1;
    if (element.closest('form')) score += 1;
    
    return score;
  }

  findTargetElement() {
    // Try platform-specific adapters first
    const platformAdapters = {
      chatgpt: {
        test: () => location.hostname.includes('openai.com') || location.hostname.includes('chatgpt.com'),
        selectors: [
          '#prompt-textarea',
          'textarea[placeholder*="message" i]',
          '[data-testid*="prompt"]',
          '[data-testid*="input"]',
          '[data-testid*="textarea"]',
          '[data-cy*="prompt"]',
          '[data-cy*="input"]'
        ]
      },
      claude: {
        test: () => location.hostname.includes('claude.ai') || location.href.includes('claude.ai/new'),
        selectors: [
          // Core input field selectors
          'div[contenteditable="true"]',
          'div[role="textbox"]',
          // Data attribute selectors (most likely for React apps)
          '[data-testid*="input"]',
          '[data-testid*="prompt"]',
          '[data-testid*="message"]',
          '[data-testid*="textarea"]',
          '[data-testid*="textbox"]',
          '[data-cy*="input"]',
          '[data-cy*="prompt"]',
          '[data-cy*="message"]',
          '[data-cy*="textarea"]',
          '[data-cy*="textbox"]',
          // Class name patterns (common in Claude's styling)
          'div[class*="input" i]',
          'div[class*="prompt" i]',
          'div[class*="message" i]',
          'div[class*="textbox" i]',
          'div[class*="textarea" i]',
          // ID patterns
          'div[id*="input" i]',
          'div[id*="prompt" i]',
          'div[id*="message" i]',
          // Common Claude patterns
          'div[placeholder*="message" i]',
          'div[placeholder*="ask" i]',
          'div[aria-label*="message" i]',
          'div[aria-label*="input" i]',
          'div[aria-label*="prompt" i]'
        ]
      },
      gemini: {
        test: () => location.hostname.includes('gemini.google.com'),
        selectors: [
          'textarea',
          'div[contenteditable="true"]',
          'div[role="textbox"]',
          '[data-testid*="input"]',
          '[data-testid*="prompt"]',
          '[data-testid*="textarea"]',
          '[data-cy*="input"]',
          '[data-cy*="prompt"]'
        ]
      },
      deepseek: {
        test: () => location.hostname.includes('deepseek.com'),
        selectors: [
          'textarea',
          'div[contenteditable="true"]',
          '[data-testid*="input"]',
          '[data-testid*="prompt"]',
          '[data-testid*="textarea"]',
          '[data-cy*="input"]',
          '[data-cy*="prompt"]'
        ]
      },
      perplexity: {
        test: () => location.hostname.includes('perplexity.ai'),
        selectors: [
          'textarea',
          'div[contenteditable="true"]',
          '[data-testid*="input"]',
          '[data-testid*="prompt"]',
          '[data-testid*="textarea"]',
          '[data-cy*="input"]',
          '[data-cy*="prompt"]'
        ]
      }
    };
    
    for (const [platform, adapter] of Object.entries(platformAdapters)) {
      if (adapter.test()) {
        for (const selector of adapter.selectors) {
          const element = document.querySelector(selector);
          if (element && this.isVisible(element)) {
            console.log(`SecureGPT: Found ${platform} element:`, selector);
            return element;
          }
        }
      }
    }
    
    // Fallback to generic detection
    const candidates = this.findInputElements();
    if (candidates.length === 0) return null;
    
    // Score and pick best candidate
    const scored = candidates.map(el => ({
      element: el,
      score: this.scoreElement(el)
    }));
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0].element;
  }

  isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return (rect.width > 0 && rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none');
  }

  // COMMENTED OUT: Only using bottom-right floating button for simplicity
  // DO NOT REMOVE THIS COMMENTED CODE - IT MAY BE NEEDED IN THE FUTURE
  /*
  createIsolatedButton() {
    const host = document.createElement('div');
    host.style.cssText = `
      position: absolute;
      z-index: 2147483647;
      pointer-events: auto;
    `;
    
    const shadow = host.attachShadow({ mode: 'open' });
    
    // Inject styles into shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      .securegpt-btn {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 6px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
        font-weight: 500;
        margin-right: 8px;
        padding: 8px;
      }
      .securegpt-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
        background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      }
    `;
    shadow.appendChild(style);
    
    // Create button
    const button = document.createElement('button');
    button.className = 'securegpt-btn';
    button.innerHTML = '<img src="' + chrome.runtime.getURL('icons/icon16-white.png') + '" width="16" height="16">';
    button.title = 'SecureGPT: Click to open menu with De-PII, file upload, and settings';
    
    shadow.appendChild(button);
    return { host, button };
  }
  */

  attachToPromptDiv(promptDiv) {
    if (promptDiv.secureGptAttached) {
      console.log('SecureGPT: Prompt div already attached, skipping');
      return;
    }
    console.log('SecureGPT: Attaching to prompt div:', promptDiv);
    promptDiv.secureGptAttached = true;
    promptDiv.secureGptDragState = false; // Track drag state
    this.currentPromptDiv = promptDiv;

    // File upload is handled via the SecureGPT modal menu

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

    // Note: File upload is now handled via the SecureGPT modal menu
  }


  toggleSecureGPTPopup() {
    // Remove existing modal if it exists
    const existingModal = document.querySelector('.securegpt-modal');
    if (existingModal) {
      existingModal.remove();
      return;
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'securegpt-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      backdrop-filter: blur(4px);
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 32px rgba(102, 126, 234, 0.2);
      padding: 0;
      max-width: 450px;
      width: 90%;
      max-height: 85vh;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    // Create header with gradient background
    const header = document.createElement('div');
    header.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    `;

    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <img src="${chrome.runtime.getURL('icons/icon32.png')}" width="32" height="32" style="border-radius: 6px;">
        <div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: white;">SecureGPT</h2>
          <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">Privacy Protection for AI Chats</div>
        </div>
      </div>
      <button class="close-btn" style="
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 8px;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: all 0.2s;
        font-weight: 500;
      ">×</button>
    `;

    // Create menu items
    const menuItems = [
      {
        icon: this.settings.enabled ? '⏸️' : '▶️',
        text: this.settings.enabled ? 'Disable Extension' : 'Enable Extension',
        action: () => this.toggleExtension(),
        description: this.settings.enabled ? 'Turn off SecureGPT' : 'Turn on SecureGPT'
      },
      {
        icon: '🛡️',
        text: 'De-PII Text',
        action: () => this.manualDePii(),
        description: 'Remove sensitive data from text'
      },
      {
        icon: '📁',
        text: 'Upload Files',
        action: () => this.openFilePicker(),
        description: 'Upload and sanitize files'
      },
      {
        icon: '⚙️',
        text: 'Settings',
        action: () => this.openSettings(),
        description: 'Configure SecureGPT options'
      }
    ];

    // Create content area
    const contentArea = document.createElement('div');
    contentArea.style.cssText = `
      padding: 24px;
      background: white;
      margin: 0;
    `;

    // Add menu items
    menuItems.forEach((item, index) => {
      const menuItem = document.createElement('div');
      menuItem.className = 'securegpt-menu-item';
      menuItem.style.cssText = `
        display: flex;
        align-items: center;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 12px;
        margin-bottom: 12px;
        border: 1px solid #e9ecef;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      `;

      menuItem.innerHTML = `
        <div style="
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-size: 20px;
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        ">${item.icon}</div>
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 16px; color: #2c3e50; margin-bottom: 4px;">${item.text}</div>
          <div style="font-size: 14px; color: #6c757d; line-height: 1.4;">${item.description}</div>
        </div>
        <div style="
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c757d;
          font-size: 16px;
        ">→</div>
      `;

      // Hover effect
      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)';
        menuItem.style.borderColor = '#667eea';
        menuItem.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
        menuItem.style.transform = 'translateY(-2px)';
      });

      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'white';
        menuItem.style.borderColor = '#e9ecef';
        menuItem.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
        menuItem.style.transform = 'translateY(0)';
      });

      // Click handler
      menuItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.action();
        modal.remove();
      });

      contentArea.appendChild(menuItem);
    });

    // Add header and content to modal
    modalContent.appendChild(header);
    modalContent.appendChild(contentArea);
    modal.appendChild(modalContent);

    // Add to document
    document.body.appendChild(modal);

    // Add entrance animation
    modal.style.opacity = '0';
    modalContent.style.transform = 'scale(0.9) translateY(20px)';
    
    requestAnimationFrame(() => {
      modal.style.transition = 'opacity 0.3s ease';
      modalContent.style.transition = 'transform 0.3s ease';
      modal.style.opacity = '1';
      modalContent.style.transform = 'scale(1) translateY(0)';
    });

    // Close modal handlers
    const closeModal = () => {
      modal.remove();
    };

    // Close button
    const closeBtn = modalContent.querySelector('.close-btn');
    closeBtn.addEventListener('click', closeModal);
    
    // Add hover effects to close button
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
      closeBtn.style.borderColor = 'rgba(255, 255, 255, 0.5)';
      closeBtn.style.transform = 'scale(1.05)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
      closeBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      closeBtn.style.transform = 'scale(1)';
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  openFilePicker() {
    // Create file input if it doesn't exist
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.multiple = true;
      this.fileInput.accept = '.txt,.md,.csv,.json,.log,.pdf,.doc,.docx,.rtf,.js,.py,.html,.xml,.yaml';
      this.fileInput.style.display = 'none';
      this.fileInput.addEventListener('change', async (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
          await this.handleSecureFileUpload(files);
        }
      });
      document.body.appendChild(this.fileInput);
    }
    
    this.fileInput.click();
  }

  // File upload functionality moved to modal menu

  toggleExtension() {
    this.settings.enabled = !this.settings.enabled;
    chrome.storage.sync.set({ secureGptSettings: this.settings });
    
    if (this.settings.enabled) {
      this.showNotification('SecureGPT enabled');
      this.showFloatingButton();
    } else {
      this.showNotification('SecureGPT disabled');
      this.hideFloatingButton();
    }
  }

  openSettings() {
    // Open the extension's settings page
    chrome.runtime.sendMessage({ action: 'openSettings' });
  }

  async handleSecureFileUpload(files) {
    if (!this.settings.enabled) return;
    
    console.log('SecureGPT: Starting secure file upload for', files.length, 'files');
    
    // Show processing indicator
    const processingIndicator = this.showProcessingIndicator(document.body, files.length);
    
    try {
      // Process files and create sanitized versions
      console.log('SecureGPT: Creating sanitized files...');
      const sanitizedFiles = await this.createSanitizedFiles(files);
      console.log('SecureGPT: Created', sanitizedFiles.length, 'sanitized files');
      
      // Insert sanitized content into the current prompt div
      if (this.currentPromptDiv) {
        console.log('SecureGPT: Inserting sanitized content into prompt div');
        await this.insertSanitizedContent(this.currentPromptDiv, sanitizedFiles);
      } else {
        console.warn('SecureGPT: No current prompt div found');
      }
      
      // Handle the sanitized files
      console.log('SecureGPT: Handling sanitized files');
      this.handleFileDrop(sanitizedFiles, this.currentPromptDiv);
      
    } catch (error) {
      console.error('SecureGPT: Error handling secure file upload:', error);
      this.showNotification(`Error processing files: ${error.message}`);
    } finally {
      // Remove processing indicator
      if (processingIndicator && processingIndicator.parentNode) {
        processingIndicator.parentNode.removeChild(processingIndicator);
      }
    }
  }


  async insertSanitizedContent(promptDiv, sanitizedFiles) {
    console.log('SecureGPT: Inserting sanitized content for', sanitizedFiles.length, 'files');
    
    // Insert sanitized file content into the prompt div
    for (const file of sanitizedFiles) {
      if (file._secureGptSanitized) {
        try {
          console.log(`SecureGPT: Inserting content for sanitized file: ${file.name}`);
          const content = await this.readFileContent(file);
          console.log(`SecureGPT: Content length to insert: ${content.length}`);
          
          // Insert content into the prompt div
          const textNode = document.createTextNode(`\n\n--- File: ${file.name} ---\n${content}\n--- End File ---\n\n`);
          promptDiv.appendChild(textNode);
          
          // Trigger input event to notify the application
          const event = new Event('input', { bubbles: true });
          promptDiv.dispatchEvent(event);
          
          console.log(`SecureGPT: Successfully inserted content for ${file.name}`);
        } catch (error) {
          console.error('SecureGPT: Error inserting sanitized content:', error);
        }
      } else {
        console.log(`SecureGPT: Skipping non-sanitized file: ${file.name}`);
      }
    }
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

  // COMMENTED OUT: Only using bottom-right floating button for simplicity
  // DO NOT REMOVE THIS COMMENTED CODE - IT MAY BE NEEDED IN THE FUTURE
  /*
  injectDePiiButton() {
    // Don't inject if already exists or extension is disabled
    if (this.dePiiButton || !this.settings.enabled) {
      console.log('SecureGPT: Button injection skipped - already exists or disabled');
      return;
    }
    
    console.log('SecureGPT: Attempting to inject De-PII button');
    
    // Look for the send button area on various AI platforms
    const sendButtonSelectors = [
      '[data-testid="send-button"]', // ChatGPT
      'button[aria-label="Send message"]', // Claude specific
      'button[aria-label*="Send" i]', // General send buttons
      'button[aria-label*="Submit" i]', // Submit buttons
      'button[type="submit"]', // Submit type buttons
      'button svg[class*="send" i]', // Send icon buttons
      'button svg[class*="arrow" i]', // Arrow icon buttons
      'button[class*="send" i]', // Send class buttons
      'button[class*="submit" i]', // Submit class buttons
      'button[title*="send" i]', // Send title buttons
      'button[title*="submit" i]', // Submit title buttons
      'button[data-testid*="send" i]',
      'button[aria-label*="Ask" i]'
    ];
    
    let sendButton = null;
    for (const selector of sendButtonSelectors) {
      sendButton = document.querySelector(selector);
      if (sendButton) {
        console.log('SecureGPT: Found send button with selector:', selector);
        break;
      }
    }
    
    if (!sendButton) {
      console.log('SecureGPT: No send button found, trying alternative approach');
      // Try to find any button that might be a send button
      const allButtons = document.querySelectorAll('button');
      console.log('SecureGPT: Found', allButtons.length, 'buttons on page');
      
      for (const button of allButtons) {
        const text = button.textContent.toLowerCase();
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
        console.log('SecureGPT: Button text:', text, 'aria-label:', ariaLabel);
        
        if (text.includes('send') || text.includes('submit') || ariaLabel.includes('send') || ariaLabel.includes('submit')) {
          sendButton = button;
          console.log('SecureGPT: Found send button by text/aria-label:', button);
          break;
        }
      }
    }

    // Create isolated button with Shadow DOM
    const buttonData = this.createIsolatedButton();
    this.dePiiButton = buttonData.button;
    this.buttonHost = buttonData.host;
    
    // Hover effect
    this.dePiiButton.addEventListener('mouseenter', () => {
      this.dePiiButton.style.background = 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)';
      this.dePiiButton.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.3)';
    });
    this.dePiiButton.addEventListener('mouseleave', () => {
      this.dePiiButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      this.dePiiButton.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.2)';
    });
    
    // Create hidden file input for secure upload
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.multiple = true;
    this.fileInput.accept = '.txt,.md,.csv,.json,.log,.pdf,.doc,.docx,.rtf,.js,.py,.html,.xml,.yaml';
    this.fileInput.style.display = 'none';
    this.fileInput.addEventListener('change', async (event) => {
      const files = Array.from(event.target.files);
      if (files.length > 0) {
        await this.handleSecureFileUpload(files);
      }
    });

    // Click handler to show popup menu
    this.dePiiButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle popup menu
      this.toggleSecureGPTPopup();
    });

    if (sendButton && sendButton.parentNode) {
      console.log('SecureGPT: Inserting button before send button');
      // Insert before send button
      sendButton.parentNode.insertBefore(this.buttonHost, sendButton);
      console.log('SecureGPT: Button successfully inserted before send button');
      return;
    }

    // Claude-specific fallback: look for the button container
    if (window.location.hostname.includes('claude.ai')) {
      console.log('SecureGPT: Claude detected, trying Claude-specific placement');
      const claudeButton = document.querySelector('button[aria-label="Send message"]');
      if (claudeButton && claudeButton.parentNode) {
        console.log('SecureGPT: Found Claude send button, inserting before it');
        claudeButton.parentNode.insertBefore(this.buttonHost, claudeButton);
        return;
      }
      
      // Try to find the button container div
      const buttonContainer = document.querySelector('div.flex.shrink-0');
      if (buttonContainer) {
        console.log('SecureGPT: Found Claude button container, inserting at end');
        buttonContainer.appendChild(this.buttonHost);
        return;
      }
    }

    // DeepSeek-specific placement: locate the toolbar with ds-atom-button controls
    if (window.location.hostname.includes('chat.deepseek.com')) {
      // Prefer a visible ds-atom-button within the prompt control bar
      const dsButtons = Array.from(document.querySelectorAll('button[class*="ds-atom-button"]'))
        .filter(btn => btn.offsetParent !== null);
      if (dsButtons.length > 0) {
        // Insert just before the first visible DeepSeek control button for consistent placement
        const firstDsButton = dsButtons[0];
        if (firstDsButton.parentNode) {
          // Tweak size to visually match DeepSeek controls
          this.buttonHost.style.height = '34px';
          this.buttonHost.style.padding = '0 8px';
          this.buttonHost.style.display = 'inline-flex';
          this.buttonHost.style.alignItems = 'center';
          this.buttonHost.style.justifyContent = 'center';
          firstDsButton.parentNode.insertBefore(this.buttonHost, firstDsButton);
          return;
        }
      }
    }

    // Fallback 1: find closest form for the textbox and place before primary submit button
    const anchor = this.currentPromptDiv ||
                   document.querySelector('div[role="textbox"]') ||
                   document.querySelector('div[contenteditable="true"]');
    if (anchor) {
      const form = anchor.closest('form');
      if (form) {
        // Heuristic: choose the last visible, enabled button as the send button
        const candidateButtons = Array.from(form.querySelectorAll('button'))
          .filter(btn => btn.offsetParent !== null && !btn.disabled);
        const lastButton = candidateButtons[candidateButtons.length - 1];
        if (lastButton && lastButton.parentNode) {
          console.log('SecureGPT: Inserting button before last form button');
          lastButton.parentNode.insertBefore(this.buttonHost, lastButton);
          console.log('SecureGPT: Button successfully inserted before form button');
          return;
        }
      }

      // Fallback 2: place adjacent to the textbox without breaking layout
      const container = anchor.parentNode;
      if (container) {
        console.log('SecureGPT: Using fallback 2 - creating wrapper');
        const wrapper = document.createElement('div');
        wrapper.style.display = 'inline-flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '8px';
        if (anchor.nextSibling) {
          container.insertBefore(wrapper, anchor.nextSibling);
        } else {
          container.appendChild(wrapper);
        }
        wrapper.appendChild(this.buttonHost);
        console.log('SecureGPT: Button inserted into wrapper');
      }
    } else {
      // Final fallback: append to body with fixed positioning
      console.log('SecureGPT: Using final fallback - appending to body');
      this.buttonHost.style.position = 'fixed';
      this.buttonHost.style.top = '20px';
      this.buttonHost.style.right = '20px';
      this.buttonHost.style.zIndex = '10000';
      document.body.appendChild(this.buttonHost);
      console.log('SecureGPT: Button appended to body with fixed positioning');
    }
  }
  */

  async createSanitizedFiles(originalFiles) {
    const sanitizedFiles = [];
    
    for (const file of originalFiles) {
      try {
        console.log(`SecureGPT: Processing file: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // Check if file format is supported
        if (!this.isSupportedFileFormat(file)) {
          console.log(`SecureGPT: Skipping unsupported file format: ${file.name}`);
          sanitizedFiles.push(file); // Keep original if unsupported
          continue;
        }
        
        // Check file size (limit to 10MB for security)
        if (file.size > 10 * 1024 * 1024) {
          console.log(`SecureGPT: File too large: ${file.name}`);
          sanitizedFiles.push(file); // Keep original if too large
          continue;
        }
        
        // Read and sanitize file content
        console.log(`SecureGPT: Reading content from ${file.name}`);
        const originalContent = await this.readFileContent(file);
        console.log(`SecureGPT: Read ${originalContent.length} characters from ${file.name}`);
        
        const sanitizedContent = this.sanitizeText(originalContent);
        console.log(`SecureGPT: Sanitized content length: ${sanitizedContent.length}`);
        
        // Only create new file if content was actually sanitized
        if (originalContent !== sanitizedContent) {
          console.log(`SecureGPT: Content was sanitized for ${file.name}`);
          // Create sanitized file
          const sanitizedBlob = new Blob([sanitizedContent], { type: file.type });
          const sanitizedFile = new File([sanitizedBlob], file.name, { 
            type: file.type,
            lastModified: file.lastModified 
          });
          
          // Add metadata to track that this file was sanitized
          sanitizedFile._secureGptSanitized = true;
          sanitizedFile._originalSize = file.size;
          sanitizedFile._sanitizedSize = sanitizedBlob.size;
          
          sanitizedFiles.push(sanitizedFile);
          console.log(`SecureGPT: Created sanitized version of ${file.name}`);
        } else {
          console.log(`SecureGPT: No sensitive data found in ${file.name}, keeping original`);
          // No sensitive data found, keep original
          sanitizedFiles.push(file);
        }
        
      } catch (error) {
        console.error('SecureGPT: Error creating sanitized file:', file.name, error);
        sanitizedFiles.push(file); // Keep original on error
      }
    }
    
    return sanitizedFiles;
  }

  replaceFilesInDropEvent(event, sanitizedFiles) {
    // Create a new DataTransfer object with sanitized files
    const newDataTransfer = new DataTransfer();
    
    sanitizedFiles.forEach(file => {
      newDataTransfer.items.add(file);
    });
    
    // Replace the dataTransfer in the event
    Object.defineProperty(event, 'dataTransfer', {
      value: newDataTransfer,
      writable: false
    });
    
    // Also update the files property
    Object.defineProperty(event.dataTransfer, 'files', {
      value: sanitizedFiles,
      writable: false
    });
  }

  async handleFileDrop(files, promptDiv) {
    if (!this.settings.enabled) return;
    
    // Show processing indicator
    const processingIndicator = this.showProcessingIndicator(promptDiv, files.length);
    
    let totalSensitiveDataFound = 0;
    let processedFiles = 0;
    let sanitizedFiles = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Update progress
        this.updateProcessingIndicator(processingIndicator, i + 1, files.length, file.name);
        
        // Check if this file was sanitized
        if (file._secureGptSanitized) {
          sanitizedFiles++;
          this.showNotification(`File ${file.name} has been sanitized and is ready to upload`);
        } else {
          // Check if file format is supported
          if (!this.isSupportedFileFormat(file)) {
            this.showNotification(`File ${file.name} is not a supported format. Supported: PDF, TXT, DOC, DOCX, MD, CSV, JSON, LOG. Skipping.`);
            continue;
          }
          
          // Check file size (limit to 10MB for security)
          if (file.size > 10 * 1024 * 1024) {
            this.showNotification(`File ${file.name} is too large (>10MB). Skipping.`);
            continue;
          }
          
          const fileContent = await this.readFileContent(file);
          const sensitiveDataFound = this.scanFileContent(fileContent, file.name);
          
          if (sensitiveDataFound > 0) {
            totalSensitiveDataFound += sensitiveDataFound;
            this.showNotification(`Found ${sensitiveDataFound} sensitive data pattern(s) in ${file.name}`);
          } else {
            this.showNotification(`No sensitive data found in ${file.name}`);
          }
        }
        
        processedFiles++;
        
      } catch (error) {
        console.error('SecureGPT: Error processing file:', file.name, error);
        this.showNotification(`Error processing ${file.name}: ${error.message}`);
      }
    }
    
    // Remove processing indicator
    if (processingIndicator && processingIndicator.parentNode) {
      processingIndicator.parentNode.removeChild(processingIndicator);
    }
    
    if (processedFiles > 0) {
      if (sanitizedFiles > 0) {
        this.showEnhancedNotification(
          `🛡️ Files Sanitized Successfully!`, 
          `${sanitizedFiles} file(s) have been sanitized and are ready to upload. Sensitive data has been replaced with placeholders.`,
          'success'
        );
      } else if (totalSensitiveDataFound > 0) {
        this.showEnhancedNotification(
          `⚠️ Sensitive Data Found!`, 
          `Found ${totalSensitiveDataFound} sensitive data pattern(s) across ${processedFiles} file(s). Review before sending.`,
          'warning'
        );
      } else {
        this.showEnhancedNotification(
          `✅ Files Scanned Successfully`, 
          `No sensitive data detected in ${processedFiles} file(s). Safe to proceed.`,
          'success'
        );
      }
    }
  }

  showProcessingIndicator(promptDiv, totalFiles) {
    const indicator = document.createElement('div');
    indicator.className = 'securegpt-processing-indicator';
    indicator.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(102, 126, 234, 0.95);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1001;
      pointer-events: none;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
      text-align: center;
      min-width: 200px;
    `;
    
    indicator.innerHTML = `
      <div style="margin-bottom: 8px;">
        <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
      <div>Processing files...</div>
      <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">0 / ${totalFiles}</div>
    `;
    
    // Add CSS animation
    if (!document.querySelector('#securegpt-spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'securegpt-spinner-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    promptDiv.style.position = 'relative';
    promptDiv.appendChild(indicator);
    return indicator;
  }

  updateProcessingIndicator(indicator, current, total, fileName) {
    if (indicator) {
      const progressText = indicator.querySelector('div:last-child');
      if (progressText) {
        progressText.textContent = `${current} / ${total} - ${fileName}`;
      }
    }
  }

  isSupportedFileFormat(file) {
    // Define supported file formats with their MIME types and extensions
    const supportedFormats = {
      // Text files
      'text/plain': ['.txt'],
      'text/markdown': ['.md', '.markdown'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/x-log': ['.log'],
      
      // PDF files
      'application/pdf': ['.pdf'],
      
      // Microsoft Word documents
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      
      // Rich Text Format
      'application/rtf': ['.rtf'],
      
      // Plain text with various extensions
      'text/': ['.txt', '.md', '.csv', '.json', '.log', '.conf', '.ini', '.cfg'],
      
      // Generic text files
      'text/': ['.text', '.readme', '.changelog', '.license']
    };
    
    // Check MIME type first
    for (const [mimeType, extensions] of Object.entries(supportedFormats)) {
      if (file.type && file.type.startsWith(mimeType)) {
        return true;
      }
    }
    
    // Check file extension as fallback
    const fileName = file.name.toLowerCase();
    const supportedExtensions = [
      '.txt', '.md', '.markdown', '.csv', '.json', '.log',
      '.pdf', '.doc', '.docx', '.rtf',
      '.text', '.readme', '.changelog', '.license', '.conf', '.ini', '.cfg'
    ];
    
    return supportedExtensions.some(ext => fileName.endsWith(ext));
  }

  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // Determine how to read the file based on its type
      if (file.type === 'application/pdf') {
        // For PDF files, we'll need to use a different approach
        // For now, we'll try to read as text (this won't work for binary PDFs)
        reader.onload = (e) => {
          const content = e.target.result;
          // Basic check if it's actually readable text
          if (this.isReadableText(content)) {
            resolve(content);
          } else {
            reject(new Error('PDF file appears to be binary and cannot be read as text. Please convert to text format first.'));
          }
        };
        reader.readAsText(file);
      } else if (file.type.startsWith('application/vnd.openxmlformats-officedocument') || 
                 file.type === 'application/msword') {
        // For DOC/DOCX files, we'll try to read as text
        // Note: This is a basic approach and may not work for all DOC files
        reader.onload = (e) => {
          const content = e.target.result;
          if (this.isReadableText(content)) {
            resolve(content);
          } else {
            reject(new Error('Document file appears to be binary and cannot be read as text. Please convert to text format first.'));
          }
        };
        reader.readAsText(file);
      } else {
        // For text files, read normally
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      }
      
      reader.onerror = (e) => reject(new Error('Failed to read file'));
    });
  }

  isReadableText(content) {
    // Check if content is readable text (not binary)
    // Look for printable characters and reasonable text patterns
    const printableChars = content.replace(/[^\x20-\x7E\s]/g, '').length;
    const totalChars = content.length;
    
    // If more than 70% of characters are printable, consider it readable text
    return totalChars > 0 && (printableChars / totalChars) > 0.7;
  }

  scanFileContent(content, fileName) {
    let sensitiveDataCount = 0;
    
    // Scan for all patterns
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      if (this.settings.patterns[patternName]) {
        const matches = content.match(pattern.regex);
        if (matches) {
          sensitiveDataCount += matches.length;
          console.log(`SecureGPT: Found ${matches.length} ${patternName} pattern(s) in ${fileName}:`, matches);
        }
      }
    }
    
    // Scan custom patterns
    if (this.settings.customPatterns && this.settings.customPatterns.hardcodedStrings) {
      this.settings.customPatterns.hardcodedStrings.forEach(item => {
        if (content.includes(item.string)) {
          sensitiveDataCount++;
          console.log(`SecureGPT: Found hardcoded string "${item.string}" in ${fileName}`);
        }
      });
    }
    
    if (this.settings.customPatterns && this.settings.customPatterns.regexPatterns) {
      this.settings.customPatterns.regexPatterns.forEach(item => {
        try {
          const regex = new RegExp(item.pattern, 'g');
          const matches = content.match(regex);
          if (matches) {
            sensitiveDataCount += matches.length;
            console.log(`SecureGPT: Found ${matches.length} custom regex pattern(s) in ${fileName}:`, matches);
          }
        } catch (error) {
          console.warn('SecureGPT: Invalid custom regex pattern:', item.pattern, error);
        }
      });
    }
    
    return sensitiveDataCount;
  }

  manualDePii() {
    // Look for various AI input elements
    const selectors = [
      '#prompt-textarea', // ChatGPT
      'textarea[placeholder*="message" i]',
      'textarea[placeholder*="ask" i]',
      'textarea[placeholder*="prompt" i]',
      'textarea[aria-label*="message" i]',
      'textarea[aria-label*="prompt" i]',
      'div[contenteditable="true"]',
      'div[role="textbox"]',
      'textarea[id*="input"]',
      'textarea[id*="message"]',
      'textarea[class*="prompt"]',
      'textarea[class*="input"]',
      'textarea[class*="message"]'
    ];
    
    let promptDiv = null;
    for (const selector of selectors) {
      promptDiv = document.querySelector(selector);
      if (promptDiv) break;
    }
    
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
      this.dePiiButton.innerHTML = '<img src="' + chrome.runtime.getURL('icons/icon16-white.png') + '" width="16" height="16">';
      this.dePiiButton.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
      
      setTimeout(() => {
        this.dePiiButton.innerHTML = originalButtonText;
        this.dePiiButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }, 1500);
  }

  sanitizeText(text) {
    let sanitized = text;
    let replacementCount = 0;

    // First, process custom hardcoded strings (exact matches)
    if (this.settings.customPatterns && this.settings.customPatterns.hardcodedStrings) {
      this.settings.customPatterns.hardcodedStrings.forEach(item => {
        if (sanitized.includes(item.string)) {
          sanitized = sanitized.replace(new RegExp(this.escapeRegExp(item.string), 'g'), item.placeholder);
          replacementCount++;
        }
      });
    }

    // Then, process custom regex patterns
    if (this.settings.customPatterns && this.settings.customPatterns.regexPatterns) {
      this.settings.customPatterns.regexPatterns.forEach(item => {
        try {
          const regex = new RegExp(item.pattern, 'g');
          const matches = sanitized.match(regex);
          if (matches) {
            sanitized = sanitized.replace(regex, item.placeholder);
            replacementCount += matches.length;
          }
        } catch (error) {
          console.warn('SecureGPT: Invalid custom regex pattern:', item.pattern, error);
        }
      });
    }

    // Finally, process built-in patterns in order of specificity (most specific first)
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
          // Use custom placeholder from settings if available, otherwise use default
          const placeholder = this.settings.placeholders && this.settings.placeholders[patternName] 
            ? this.settings.placeholders[patternName] 
            : pattern.placeholder;
          sanitized = sanitized.replace(pattern.regex, placeholder);
          replacementCount += matches.length;
        }
      }
    }

    return sanitized;
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  showFileDropAlert(files) {
    // Play a subtle sound alert if possible
    this.playDropSound();
    
    // Create a prominent alert for file drop
    const alert = document.createElement('div');
    alert.className = 'securegpt-file-drop-alert';
    alert.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      z-index: 10002;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
      text-align: center;
      min-width: 300px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      animation: securegpt-alert-pop 0.3s ease-out;
    `;
    
    const fileNames = files.map(f => f.name).join(', ');
    const fileCount = files.length;
    
    alert.innerHTML = `
      <div style="margin-bottom: 12px; font-size: 24px;">📁</div>
      <div style="margin-bottom: 8px;">File${fileCount > 1 ? 's' : ''} Dropped!</div>
      <div style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">
        ${fileCount} file${fileCount > 1 ? 's' : ''}: ${fileNames.length > 50 ? fileNames.substring(0, 50) + '...' : fileNames}
      </div>
      <div style="font-size: 12px; opacity: 0.8;">
        Scanning for sensitive data...
      </div>
    `;
    
    // Add CSS animation
    if (!document.querySelector('#securegpt-alert-styles')) {
      const style = document.createElement('style');
      style.id = 'securegpt-alert-styles';
      style.textContent = `
        @keyframes securegpt-alert-pop {
          0% { 
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
          100% { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(alert);
    
    // Also show a browser notification if permission is granted
    this.showBrowserNotification(`SecureGPT: ${fileCount} file${fileCount > 1 ? 's' : ''} dropped for scanning`);
    
    // Auto-remove after 4 seconds (longer to ensure user sees it)
    setTimeout(() => {
      if (alert.parentNode) {
        alert.style.animation = 'securegpt-alert-pop 0.3s ease-out reverse';
        setTimeout(() => {
          if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
          }
        }, 300);
      }
    }, 4000);
  }

  playDropSound() {
    try {
      // Create a subtle audio context for drop sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silently fail if audio context is not available
      console.log('SecureGPT: Audio context not available');
    }
  }

  showBrowserNotification(message) {
    // Request notification permission and show browser notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('SecureGPT', {
          body: message,
          icon: chrome.runtime.getURL('icons/icon48.png'),
          tag: 'securegpt-file-drop'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('SecureGPT', {
              body: message,
              icon: chrome.runtime.getURL('icons/icon48.png'),
              tag: 'securegpt-file-drop'
            });
          }
        });
      }
    }
  }

  showEnhancedNotification(title, message, type = 'info') {
    // Create an enhanced notification with title and message
    const notification = document.createElement('div');
    
    const colors = {
      success: { bg: '#4CAF50', border: '#45a049' },
      warning: { bg: '#ff9800', border: '#e68900' },
      error: { bg: '#f44336', border: '#da190b' },
      info: { bg: '#2196F3', border: '#0b7dda' }
    };
    
    const color = colors[type] || colors.info;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${color.bg};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      max-width: 350px;
      border-left: 4px solid ${color.border};
      animation: securegpt-notification-slide 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px; font-size: 15px;">${title}</div>
      <div style="opacity: 0.9; line-height: 1.4;">${message}</div>
    `;
    
    // Add CSS animation
    if (!document.querySelector('#securegpt-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'securegpt-notification-styles';
      style.textContent = `
        @keyframes securegpt-notification-slide {
          0% { 
            transform: translateX(100%);
            opacity: 0;
          }
          100% { 
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds (longer for important messages)
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'securegpt-notification-slide 0.3s ease-out reverse';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
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

  setupDebugging() {
    // Add debug tools to window
    window.secureGPTDebug = {
      findTargets: () => {
        const targets = this.findInputElements();
        console.log('SecureGPT: Found input elements:', targets);
        return targets;
      },

      investigateDOM: () => {
        return this.investigateRealDOM();
      },

      testInjection: () => {
        const target = this.findTargetElement();
        if (target) {
          console.log('SecureGPT: Target element:', target);
          const button = this.createIsolatedButton();
          this.buttonHost = button.host;
          this.dePiiButton = button.button;
          document.body.appendChild(button.host);
          console.log('SecureGPT: Button injected successfully');
        } else {
          console.log('SecureGPT: No target element found');
        }
      },

      checkObservers: () => {
        console.log('SecureGPT: Active observers:', this.observers);
      },

      runTests: () => {
        this.runInjectionTests();
      },

      // New debugging methods for floating button
      toggleFloatingButton: () => {
        if (this.isFloatingButtonVisible()) {
          this.hideFloatingButton();
        } else {
          this.showFloatingButton();
        }
      },

      showFloatingButton: () => {
        this.showFloatingButton();
      },

      hideFloatingButton: () => {
        this.hideFloatingButton();
      },

      isFloatingButtonVisible: () => {
        return this.isFloatingButtonVisible();
      },

      getSettings: () => {
        return this.settings;
      },

      toggleExtension: () => {
        this.toggleExtension();
      }
    };

    console.log('SecureGPT Debug Tools Available:');
    console.log('- secureGPTDebug.findTargets()');
    console.log('- secureGPTDebug.investigateDOM()');
    console.log('- secureGPTDebug.testInjection()');
    console.log('- secureGPTDebug.checkObservers()');
    console.log('- secureGPTDebug.runTests()');
    console.log('- secureGPTDebug.toggleFloatingButton()');
    console.log('- secureGPTDebug.showFloatingButton()');
    console.log('- secureGPTDebug.hideFloatingButton()');
    console.log('- secureGPTDebug.isFloatingButtonVisible()');
    console.log('- secureGPTDebug.getSettings()');
    console.log('- secureGPTDebug.toggleExtension()');
  }

  investigateRealDOM() {
    console.log('🔍 Investigating real DOM structure for', window.location.hostname);

    const investigation = {
      url: window.location.href,
      hostname: window.location.hostname,
      timestamp: new Date().toISOString(),
      findings: {}
    };

    // 1. Find all potential input elements using comprehensive selectors
    const inputSelectors = [
      'textarea',
      'input[type="text"]',
      'input:not([type])',
      '[contenteditable="true"]',
      '[contenteditable=""]',
      '[role="textbox"]',
      'div[contenteditable]',
      'div[role="textbox"]',
      // Data attribute selectors
      '[data-testid*="prompt"]',
      '[data-testid*="input"]',
      '[data-testid*="textarea"]',
      '[data-testid*="message"]',
      '[data-testid*="textbox"]',
      '[data-cy*="prompt"]',
      '[data-cy*="input"]',
      '[data-cy*="textarea"]',
      '[data-cy*="message"]',
      '[data-cy*="textbox"]',
      // Class and ID patterns
      'div[class*="input" i]',
      'div[class*="prompt" i]',
      'div[class*="message" i]',
      'div[class*="textbox" i]',
      'div[class*="textarea" i]',
      'div[id*="input" i]',
      'div[id*="prompt" i]',
      'div[id*="message" i]',
      // Aria and placeholder patterns
      'div[aria-label*="message" i]',
      'div[aria-label*="input" i]',
      'div[aria-label*="prompt" i]',
      'div[placeholder*="message" i]',
      'div[placeholder*="ask" i]',
      'div[placeholder*="prompt" i]'
    ];

    const inputElements = [];
    inputSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 20) { // Only reasonably sized elements
          inputElements.push({
            selector: selector,
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            contentEditable: el.getAttribute('contenteditable'),
            role: el.getAttribute('role'),
            placeholder: el.getAttribute('placeholder'),
            ariaLabel: el.getAttribute('aria-label'),
            dataTestId: el.getAttribute('data-testid'),
            dataCy: el.getAttribute('data-cy'),
            rect: {
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left
            },
            isVisible: rect.width > 0 && rect.height > 0 &&
                      getComputedStyle(el).visibility !== 'hidden' &&
                      getComputedStyle(el).display !== 'none',
            textContent: el.textContent ? el.textContent.substring(0, 100) : null,
            innerHTML: el.innerHTML ? el.innerHTML.substring(0, 100) : null
          });
        }
      });
    });

    investigation.findings.inputElements = inputElements;
    console.log(`Found ${inputElements.length} potential input elements:`, inputElements);

    // 2. Find all buttons
    const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
      text: btn.textContent ? btn.textContent.trim() : '',
      ariaLabel: btn.getAttribute('aria-label'),
      className: btn.className,
      id: btn.id,
      type: btn.type,
      disabled: btn.disabled,
      visible: btn.offsetParent !== null,
      rect: btn.getBoundingClientRect(),
      dataTestId: btn.getAttribute('data-testid')
    }));

    investigation.findings.buttons = buttons;
    console.log(`Found ${buttons.length} buttons:`, buttons);

    // 3. Find forms
    const forms = Array.from(document.querySelectorAll('form')).map(form => ({
      className: form.className,
      id: form.id,
      action: form.action,
      method: form.method,
      childCount: form.children.length
    }));

    investigation.findings.forms = forms;
    console.log(`Found ${forms.length} forms:`, forms);

    // 4. Look for specific AI platform patterns
    const patterns = {
      textareaWithPlaceholder: document.querySelectorAll('textarea[placeholder]'),
      buttonWithAriaLabel: document.querySelectorAll('button[aria-label]'),
      buttonWithDataTestId: document.querySelectorAll('button[data-testid]'),
      divWithRoleTextbox: document.querySelectorAll('div[role="textbox"]'),
      contentEditableWithPlaceholder: document.querySelectorAll('[contenteditable][placeholder]')
    };

    investigation.findings.patterns = {
      textareaWithPlaceholder: Array.from(patterns.textareaWithPlaceholder).map(el => ({
        tag: el.tagName,
        placeholder: el.placeholder,
        id: el.id,
        className: el.className
      })),
      buttonWithAriaLabel: Array.from(patterns.buttonWithAriaLabel).map(el => ({
        text: el.textContent?.trim(),
        ariaLabel: el.getAttribute('aria-label'),
        id: el.id,
        className: el.className
      })),
      buttonWithDataTestId: Array.from(patterns.buttonWithDataTestId).map(el => ({
        text: el.textContent?.trim(),
        dataTestId: el.getAttribute('data-testid'),
        id: el.id,
        className: el.className
      })),
      divWithRoleTextbox: Array.from(patterns.divWithRoleTextbox).map(el => ({
        textContent: el.textContent?.substring(0, 50),
        role: el.getAttribute('role'),
        id: el.id,
        className: el.className
      })),
      contentEditableWithPlaceholder: Array.from(patterns.contentEditableWithPlaceholder).map(el => ({
        placeholder: el.getAttribute('placeholder'),
        id: el.id,
        className: el.className
      }))
    };

    console.log('Patterns found:', investigation.findings.patterns);

    // 5. Summary
    const summary = {
      totalInputElements: inputElements.length,
      totalButtons: buttons.length,
      totalForms: forms.length,
      hasContentEditable: inputElements.some(el => el.contenteditable === 'true'),
      hasTextareas: inputElements.some(el => el.tagName === 'TEXTAREA'),
      hasRoleTextbox: inputElements.some(el => el.role === 'textbox'),
      platform: window.location.hostname,
      viableInputElements: inputElements.filter(el => el.visible && el.rect.width > 200),
      viableButtons: buttons.filter(btn => btn.visible && btn.text && btn.text.length > 0)
    };

    investigation.summary = summary;
    console.log('📊 Investigation Summary:', summary);

    // Save to window for access
    window.secureGPTInvestigation = investigation;

    return investigation;
  }

  createFloatingFallback() {
    // Don't create if already exists
    if (document.getElementById('securegpt-fallback')) {
      return;
    }

    // Create floating fallback button with proper SecureGPT branding
    const fallback = document.createElement('div');
    fallback.id = 'securegpt-fallback';
    fallback.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
      transition: all 0.2s ease;
      border: 2px solid rgba(255, 255, 255, 0.2);
    `;

    // Use the actual SecureGPT icon
    const iconImg = document.createElement('img');
    iconImg.src = chrome.runtime.getURL('icons/icon48.png');
    iconImg.style.cssText = `
      width: 32px;
      height: 32px;
      filter: brightness(0) invert(1);
    `;

    fallback.appendChild(iconImg);
    fallback.title = 'SecureGPT: Click to open menu';

    // Add hover effects
    fallback.addEventListener('mouseover', () => {
      fallback.style.transform = 'scale(1.05)';
      fallback.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
    });

    fallback.addEventListener('mouseout', () => {
      fallback.style.transform = 'scale(1)';
      fallback.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.3)';
    });

    fallback.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSecureGPTPopup();
    });

    document.body.appendChild(fallback);
    console.log('SecureGPT: Floating fallback button created and displayed');
  }

  showFloatingButton() {
    const fallback = document.getElementById('securegpt-fallback');
    if (fallback) {
      fallback.style.display = 'flex';
      console.log('SecureGPT: Floating button shown');
    } else {
      // Create the button if it doesn't exist
      this.createFloatingFallback();
    }
  }

  hideFloatingButton() {
    const fallback = document.getElementById('securegpt-fallback');
    if (fallback) {
      fallback.style.display = 'none';
      console.log('SecureGPT: Floating button hidden');
    }
  }

  isFloatingButtonVisible() {
    const fallback = document.getElementById('securegpt-fallback');
    return fallback && fallback.style.display !== 'none';
  }

  runInjectionTests() {
    const tests = [
      {
        name: 'Element Detection',
        test: () => this.findInputElements().length > 0
      },
      {
        name: 'Button Creation',
        test: () => {
          const button = this.createIsolatedButton();
          return button && button.host && button.button;
        }
      },
      {
        name: 'Shadow DOM Isolation',
        test: () => {
          const button = this.createIsolatedButton();
          return button.host.shadowRoot !== null;
        }
      },
      {
        name: 'Platform Detection',
        test: () => {
          const target = this.findTargetElement();
          return target !== null;
        }
      }
    ];
    
    console.log('SecureGPT: Running Injection Tests:');
    tests.forEach(test => {
      const result = test.test();
      console.log(`${test.name}: ${result ? '✅ PASS' : '❌ FAIL'}`);
    });
  }
}

// Initialize SecureGPT when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.secureGPTInstance = new SecureGPTSimple();
  });
} else {
  window.secureGPTInstance = new SecureGPTSimple();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateSettings') {
    // Reload the page to apply new settings
    window.location.reload();
  }
});

// Listen for storage changes to update button visibility
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.secureGptSettings) {
    const newSettings = changes.secureGptSettings.newValue;
    if (newSettings && typeof newSettings.enabled !== 'undefined') {
      // Update the local settings
      if (window.secureGPTInstance) {
        window.secureGPTInstance.settings.enabled = newSettings.enabled;
        
        // Show or hide the floating button based on enabled state
        if (newSettings.enabled) {
          window.secureGPTInstance.showFloatingButton();
        } else {
          window.secureGPTInstance.hideFloatingButton();
        }
      }
    }
  }
});
