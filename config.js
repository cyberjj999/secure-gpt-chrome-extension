class ConfigManager {
  constructor() {
    this.settings = {
      enabled: true,
      showNotifications: true,
      autoScan: true,
      patterns: {
        email: true,
        phone: true,
        phoneInternational: true,
        ssn: true,
        creditCard: true,
        creditCardGeneric: true,
        apiKey: true,
        ipAddress: true,
        bankAccount: true,
        passport: true,
        address: true
      },
      websites: {
        chatgpt: true,
        claude: true,
        gemini: true,
        llama: true,
        mistral: true,
        grok: true,
        cohere: true,
        perplexity: true
      },
      placeholders: {
        email: '[EMAIL_REDACTED]',
        phone: '[PHONE_REDACTED]',
        phoneInternational: '[PHONE_REDACTED]',
        ssn: '[SSN_REDACTED]',
        creditCard: '[CREDIT_CARD_REDACTED]',
        creditCardGeneric: '[CREDIT_CARD_REDACTED]',
        apiKey: '[API_KEY_REDACTED]',
        ipAddress: '[IP_ADDRESS_REDACTED]',
        bankAccount: '[ACCOUNT_NUMBER_REDACTED]',
        passport: '[PASSPORT_REDACTED]',
        address: '[ADDRESS_REDACTED]'
      },
      ignoreList: []
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }

  async loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      this.settings = {
        enabled: true,
        showNotifications: true,
        autoScan: true,
        patterns: {
          email: true,
          phone: true,
          phoneInternational: true,
          ssn: true,
          creditCard: true,
          creditCardGeneric: true,
          apiKey: true,
          ipAddress: true,
          bankAccount: true,
          passport: true,
          address: true
        },
        placeholders: {
          email: '[EMAIL_REDACTED]',
          phone: '[PHONE_REDACTED]',
          phoneInternational: '[PHONE_REDACTED]',
          ssn: '[SSN_REDACTED]',
          creditCard: '[CREDIT_CARD_REDACTED]',
          creditCardGeneric: '[CREDIT_CARD_REDACTED]',
          apiKey: '[API_KEY_REDACTED]',
          ipAddress: '[IP_ADDRESS_REDACTED]',
          bankAccount: '[ACCOUNT_NUMBER_REDACTED]',
          passport: '[PASSPORT_REDACTED]',
          address: '[ADDRESS_REDACTED]'
        },
        ...response
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use defaults
    }
  }

  setupEventListeners() {
    // Main toggles
    document.getElementById('enabledToggle').addEventListener('change', (e) => {
      this.settings.enabled = e.target.checked;
    });

    document.getElementById('notificationsToggle').addEventListener('change', (e) => {
      this.settings.showNotifications = e.target.checked;
    });

    document.getElementById('autoScanToggle').addEventListener('change', (e) => {
      this.settings.autoScan = e.target.checked;
    });

    // Pattern checkboxes
    Object.keys(this.settings.patterns).forEach(pattern => {
      const checkbox = document.getElementById(`pattern-${pattern}`);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          this.settings.patterns[pattern] = e.target.checked;
        });
      }
    });

    // Placeholder inputs
    Object.keys(this.settings.placeholders).forEach(pattern => {
      const input = document.getElementById(`placeholder-${pattern}`);
      if (input) {
        input.addEventListener('input', (e) => {
          this.settings.placeholders[pattern] = e.target.value || this.settings.placeholders[pattern];
        });
      }
    });

    // Website checkboxes
    Object.keys(this.settings.websites).forEach(website => {
      const checkbox = document.getElementById(`website-${website}`);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          this.settings.websites[website] = e.target.checked;
        });
      }
    });

    // Test buttons
    document.querySelectorAll('.test-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pattern = e.target.getAttribute('data-pattern');
        this.testPattern(pattern);
      });
    });

    // Ignore list functionality
    const addIgnoreBtn = document.getElementById('addIgnoreBtn');
    const ignoreInput = document.getElementById('ignoreInput');
    
    addIgnoreBtn.addEventListener('click', () => {
      this.addToIgnoreList();
    });
    
    ignoreInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addToIgnoreList();
      }
    });

    // Action buttons
    document.getElementById('saveButton').addEventListener('click', () => this.saveSettings());
    document.getElementById('resetButton').addEventListener('click', () => this.resetSettings());
    document.getElementById('backToPopup').addEventListener('click', () => this.goBack());
  }

  updateUI() {
    // Update toggles
    document.getElementById('enabledToggle').checked = this.settings.enabled;
    document.getElementById('notificationsToggle').checked = this.settings.showNotifications;
    document.getElementById('autoScanToggle').checked = this.settings.autoScan;

    // Update pattern checkboxes
    Object.entries(this.settings.patterns).forEach(([pattern, enabled]) => {
      const checkbox = document.getElementById(`pattern-${pattern}`);
      if (checkbox) {
        checkbox.checked = enabled;
      }
    });

    // Update placeholder inputs
    Object.entries(this.settings.placeholders).forEach(([pattern, placeholder]) => {
      const input = document.getElementById(`placeholder-${pattern}`);
      if (input) {
        input.value = placeholder;
      }
    });

    // Update website checkboxes
    Object.entries(this.settings.websites).forEach(([website, enabled]) => {
      const checkbox = document.getElementById(`website-${website}`);
      if (checkbox) {
        checkbox.checked = enabled;
      }
    });

    // Update ignore list
    this.updateIgnoreList();
  }

  async saveSettings() {
    try {
      await chrome.runtime.sendMessage({
        action: 'saveSettings',
        settings: this.settings
      });
      
      this.showStatusMessage('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showStatusMessage('Failed to save settings. Please try again.', 'error');
    }
  }

  resetSettings() {
    this.settings = {
      enabled: true,
      showNotifications: true,
      autoScan: true,
      patterns: {
        email: true,
        phone: true,
        phoneInternational: true,
        ssn: true,
        creditCard: true,
        creditCardGeneric: true,
        apiKey: true,
        ipAddress: true,
        bankAccount: true,
        passport: true,
        address: true
      },
      websites: {
        chatgpt: true,
        claude: true,
        gemini: true,
        llama: true,
        mistral: true,
        grok: true,
        cohere: true,
        perplexity: true
      },
      placeholders: {
        email: '[EMAIL_REDACTED]',
        phone: '[PHONE_REDACTED]',
        phoneInternational: '[PHONE_REDACTED]',
        ssn: '[SSN_REDACTED]',
        creditCard: '[CREDIT_CARD_REDACTED]',
        creditCardGeneric: '[CREDIT_CARD_REDACTED]',
        apiKey: '[API_KEY_REDACTED]',
        ipAddress: '[IP_ADDRESS_REDACTED]',
        bankAccount: '[ACCOUNT_NUMBER_REDACTED]',
        passport: '[PASSPORT_REDACTED]',
        address: '[ADDRESS_REDACTED]'
      }
    };
    
    this.updateUI();
    this.showStatusMessage('Settings reset to defaults!', 'success');
  }

  testPattern(patternName) {
    const testInput = document.getElementById(`test-${patternName}`);
    const testText = testInput.value.trim();
    
    if (!testText) {
      this.showTestResult(patternName, 'Please enter text to test', 'warning');
      return;
    }

    // Define patterns (same as content script)
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi,
      phone: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
      phoneInternational: /\+[1-9]\d{1,14}\b/g,
      ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
      creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
      creditCardGeneric: /\b\d{13,19}\b/g,
      apiKey: /\b[A-Za-z0-9]{20,}\b/g,
      ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      bankAccount: /\b(?:account|acct|routing)[\s#:]*\d{8,17}\b/gi,
      passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
      address: /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way)\b/gi
    };

    const pattern = patterns[patternName];
    if (!pattern) {
      this.showTestResult(patternName, 'Pattern not found', 'error');
      return;
    }

    const isDetected = pattern.test(testText);
    const placeholder = this.settings.placeholders[patternName] || `[${patternName.toUpperCase()}_REDACTED]`;
    
    if (isDetected) {
      const sanitized = testText.replace(pattern, placeholder);
      this.showTestResult(patternName, `Detected! Would become: "${sanitized}"`, 'detected');
    } else {
      this.showTestResult(patternName, 'No sensitive data detected', 'safe');
    }
  }

  showTestResult(patternName, message, type) {
    // Remove existing result
    const testContainer = document.querySelector(`#test-${patternName}`).parentNode;
    const existingResult = testContainer.querySelector('.test-result');
    if (existingResult) {
      existingResult.remove();
    }

    // Create new result
    const result = document.createElement('div');
    result.className = `test-result ${type}`;
    result.textContent = message;
    
    // Insert at the beginning of the test container (above input and button)
    testContainer.insertBefore(result, testContainer.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (result.parentNode) {
        result.remove();
      }
    }, 5000);
  }

  showStatusMessage(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type} show`;
    
    setTimeout(() => {
      statusMessage.classList.remove('show');
    }, 3000);
  }

  addToIgnoreList() {
    const ignoreInput = document.getElementById('ignoreInput');
    const text = ignoreInput.value.trim();
    
    if (!text) return;
    
    if (this.settings.ignoreList.includes(text)) {
      this.showStatusMessage('Text already in ignore list', 'warning');
      return;
    }
    
    this.settings.ignoreList.push(text);
    ignoreInput.value = '';
    this.updateIgnoreList();
    this.showStatusMessage('Added to ignore list', 'success');
  }

  removeFromIgnoreList(text) {
    this.settings.ignoreList = this.settings.ignoreList.filter(item => item !== text);
    this.updateIgnoreList();
    this.showStatusMessage('Removed from ignore list', 'success');
  }

  updateIgnoreList() {
    const ignoreListDiv = document.getElementById('ignoreList');
    ignoreListDiv.innerHTML = '';
    
    if (this.settings.ignoreList.length === 0) {
      ignoreListDiv.innerHTML = '<div style="color: #6c757d; font-style: italic; padding: 8px;">No items in ignore list</div>';
      return;
    }
    
    this.settings.ignoreList.forEach(text => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'ignore-item';
      itemDiv.innerHTML = `
        <span class="ignore-item-text" title="${text}">${text}</span>
        <button class="ignore-item-remove" onclick="configManager.removeFromIgnoreList('${text}')">×</button>
      `;
      ignoreListDiv.appendChild(itemDiv);
    });
  }

  goBack() {
    // Close the current tab and return to the extension popup
    window.close();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ConfigManager();
});
