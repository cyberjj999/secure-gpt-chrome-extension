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

    this.setupEventListeners();
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
              
              let foundElement = null;
              for (const selector of selectors) {
                const element = node.querySelector ? node.querySelector(selector) : null;
                if (element || (node.matches && node.matches(selector))) {
                  foundElement = element || node;
                  break;
                }
              }
              
              if (foundElement) {
                this.attachToPromptDiv(foundElement);
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
    // Look for existing prompt divs on various AI platforms
    const selectors = [
      '#prompt-textarea', // ChatGPT
      'textarea[placeholder*="message" i]', // General message textareas
      'textarea[placeholder*="ask" i]', // Ask prompts
      'textarea[placeholder*="prompt" i]', // Prompt textareas
      'textarea[aria-label*="message" i]', // Aria label message
      'textarea[aria-label*="prompt" i]', // Aria label prompt
      'div[contenteditable="true"]', // Contenteditable divs
      'div[role="textbox"]', // Textbox role divs
      'textarea[id*="input"]', // Input textareas
      'textarea[id*="message"]', // Message textareas
      'textarea[class*="prompt"]', // Prompt class textareas
      'textarea[class*="input"]', // Input class textareas
      'textarea[class*="message"]' // Message class textareas
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        this.attachToPromptDiv(element);
        break; // Only attach to the first found element
      }
    }
    
    // Inject De-PII button
    this.injectDePiiButton();
  }

  attachToPromptDiv(promptDiv) {
    if (promptDiv.secureGptAttached) return;
    promptDiv.secureGptAttached = true;
    promptDiv.secureGptDragState = false; // Track drag state
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

    // Global drag end event to reset drag state
    document.addEventListener('dragend', () => {
      if (promptDiv.secureGptDragState) {
        promptDiv.secureGptDragState = false;
        promptDiv.style.border = '';
        promptDiv.style.backgroundColor = '';
        
        const indicator = promptDiv.querySelector('.securegpt-drop-indicator');
        if (indicator) {
          indicator.remove();
        }
      }
    });

    // Listen for file drop events
    promptDiv.addEventListener('dragover', (event) => {
      if (!this.settings.enabled) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    });

    promptDiv.addEventListener('dragenter', (event) => {
      if (!this.settings.enabled) return;
      event.preventDefault();
      
      // Only add indicator if not already in drag state
      if (!promptDiv.secureGptDragState) {
        promptDiv.secureGptDragState = true;
        promptDiv.style.border = '2px dashed #667eea';
        promptDiv.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        promptDiv.style.transition = 'all 0.2s ease';
        
        // Add visual indicator
        const indicator = document.createElement('div');
        indicator.className = 'securegpt-drop-indicator';
        indicator.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(102, 126, 234, 0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          z-index: 1000;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        `;
        indicator.textContent = 'Drop files to scan for sensitive data';
        promptDiv.style.position = 'relative';
        promptDiv.appendChild(indicator);
      }
    });

    promptDiv.addEventListener('dragleave', (event) => {
      if (!this.settings.enabled) return;
      event.preventDefault();
      
      // Only remove indicator if we're actually leaving the element
      // Check if the related target is outside the promptDiv
      if (!promptDiv.contains(event.relatedTarget)) {
        promptDiv.secureGptDragState = false;
        promptDiv.style.border = '';
        promptDiv.style.backgroundColor = '';
        
        // Remove visual indicator
        const indicator = promptDiv.querySelector('.securegpt-drop-indicator');
        if (indicator) {
          indicator.remove();
        }
      }
    });

    promptDiv.addEventListener('drop', (event) => {
      if (!this.settings.enabled) return;
      event.preventDefault();
      
      // Reset drag state
      promptDiv.secureGptDragState = false;
      promptDiv.style.border = '';
      promptDiv.style.backgroundColor = '';
      
      // Remove visual indicator
      const indicator = promptDiv.querySelector('.securegpt-drop-indicator');
      if (indicator) {
        indicator.remove();
      }
      
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        // Show immediate alert for file drop
        this.showFileDropAlert(files);
        this.handleFileDrop(files, promptDiv);
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
    
    // Look for the send button area on various AI platforms
    const sendButtonSelectors = [
      '[data-testid="send-button"]', // ChatGPT
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
      if (sendButton) break;
    }

    // Create De-PII button
    this.dePiiButton = document.createElement('button');
    this.dePiiButton.innerHTML = '<img src="' + chrome.runtime.getURL('icons/icon16-white.png') + '" width="16" height="16">';
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

    if (sendButton && sendButton.parentNode) {
      // Insert before send button
      sendButton.parentNode.insertBefore(this.dePiiButton, sendButton);
      return;
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
          this.dePiiButton.style.height = '34px';
          this.dePiiButton.style.padding = '0 8px';
          this.dePiiButton.style.display = 'inline-flex';
          this.dePiiButton.style.alignItems = 'center';
          this.dePiiButton.style.justifyContent = 'center';
          firstDsButton.parentNode.insertBefore(this.dePiiButton, firstDsButton);
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
          lastButton.parentNode.insertBefore(this.dePiiButton, lastButton);
          return;
        }
      }

      // Fallback 2: place adjacent to the textbox without breaking layout
      const container = anchor.parentNode;
      if (container) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'inline-flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '8px';
        if (anchor.nextSibling) {
          container.insertBefore(wrapper, anchor.nextSibling);
        } else {
          container.appendChild(wrapper);
        }
        wrapper.appendChild(this.dePiiButton);
      }
    }
  }

  async handleFileDrop(files, promptDiv) {
    if (!this.settings.enabled) return;
    
    // Show processing indicator
    const processingIndicator = this.showProcessingIndicator(promptDiv, files.length);
    
    let totalSensitiveDataFound = 0;
    let processedFiles = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Update progress
        this.updateProcessingIndicator(processingIndicator, i + 1, files.length, file.name);
        
        // Check file size (limit to 10MB for security)
        if (file.size > 10 * 1024 * 1024) {
          this.showNotification(`File ${file.name} is too large (>10MB). Skipping.`);
          continue;
        }
        
        // Check if file format is supported
        if (!this.isSupportedFileFormat(file)) {
          this.showNotification(`File ${file.name} is not a supported format. Supported: PDF, TXT, DOC, DOCX, MD, CSV, JSON, LOG. Skipping.`);
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
      if (totalSensitiveDataFound > 0) {
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
