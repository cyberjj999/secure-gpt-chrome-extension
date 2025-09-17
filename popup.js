// SecureGPT Popup Script

class PopupManager {
  constructor() {
    this.settings = null;
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
          ssn: true,
          creditCard: true,
          apiKey: true,
          ipAddress: true,
          bankAccount: true,
          passport: true,
          address: true
        },
        placeholders: {
          email: '[EMAIL_REDACTED]',
          phone: '[PHONE_REDACTED]',
          ssn: '[SSN_REDACTED]',
          creditCard: '[CREDIT_CARD_REDACTED]',
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
      this.settings = {
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
        },
        placeholders: {
          email: '[EMAIL_REDACTED]',
          phone: '[PHONE_REDACTED]',
          ssn: '[SSN_REDACTED]',
          creditCard: '[CREDIT_CARD_REDACTED]',
          apiKey: '[API_KEY_REDACTED]',
          ipAddress: '[IP_ADDRESS_REDACTED]',
          bankAccount: '[ACCOUNT_NUMBER_REDACTED]',
          passport: '[PASSPORT_REDACTED]',
          address: '[ADDRESS_REDACTED]'
        }
      };
    }
  }

  setupEventListeners() {
    // Main toggle
    const enabledToggle = document.getElementById('enabledToggle');
    enabledToggle.addEventListener('change', (e) => {
      this.settings.enabled = e.target.checked;
      this.updateStatus();
    });

    // Notifications toggle
    const notificationsToggle = document.getElementById('notificationsToggle');
    notificationsToggle.addEventListener('change', (e) => {
      this.settings.showNotifications = e.target.checked;
    });

    // Auto-scan toggle
    const autoScanToggle = document.getElementById('autoScanToggle');
    autoScanToggle.addEventListener('change', (e) => {
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

    // Test buttons
    document.querySelectorAll('.test-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pattern = e.target.getAttribute('data-pattern');
        this.testPattern(pattern);
      });
    });

    // Open configuration page
    const openConfigBtn = document.getElementById('openConfigPageBtn');
    openConfigBtn.addEventListener('click', () => this.openConfigPage());

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

    this.updateAllPatterns();
    this.updateStatus();
  }

  updateAllPatterns() {
    // Define all patterns with their display names
    const patternNames = {
      email: 'Email',
      phone: 'Phone',
      phoneInternational: 'Intl Phone',
      ssn: 'SSN',
      creditCard: 'Credit Card',
      creditCardGeneric: 'Generic Card',
      apiKey: 'API Key',
      ipAddress: 'IP Address',
      bankAccount: 'Bank Account',
      passport: 'Passport',
      address: 'Address'
    };
    
    const allPatternsContainer = document.getElementById('allPatterns');
    allPatternsContainer.innerHTML = '';
    
    Object.entries(this.settings.patterns).forEach(([pattern, enabled]) => {
      const tag = document.createElement('span');
      tag.className = 'pattern-tag';
      tag.textContent = patternNames[pattern] || pattern.charAt(0).toUpperCase() + pattern.slice(1);
      if (!enabled) {
        tag.style.opacity = '0.5';
        tag.style.background = 'linear-gradient(135deg, #6c757d 0%, #495057 100%)';
      }
      allPatternsContainer.appendChild(tag);
    });
  }

  updateStatus() {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    if (this.settings.enabled) {
      statusIndicator.classList.remove('disabled');
      statusText.textContent = 'Protection Active';
    } else {
      statusIndicator.classList.add('disabled');
      statusText.textContent = 'Protection Disabled';
    }
  }

  async saveSettings() {
    const saveButton = document.getElementById('saveButton');
    const originalText = saveButton.textContent;
    
    try {
      saveButton.textContent = 'Saving...';
      saveButton.disabled = true;
      
      await chrome.runtime.sendMessage({
        action: 'saveSettings',
        settings: this.settings
      });
      
      saveButton.textContent = 'Saved!';
      saveButton.classList.add('saved');
      
      setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.disabled = false;
        saveButton.classList.remove('saved');
      }, 1500);
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      saveButton.textContent = 'Error';
      
      setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.disabled = false;
      }, 1500);
    }
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
    const existingResult = document.querySelector(`#test-${patternName}`).parentNode.querySelector('.test-result');
    if (existingResult) {
      existingResult.remove();
    }

    // Create new result
    const result = document.createElement('div');
    result.className = `test-result ${type}`;
    result.textContent = message;
    
    // Insert after the test input
    const testInput = document.getElementById(`test-${patternName}`);
    testInput.parentNode.appendChild(result);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (result.parentNode) {
        result.remove();
      }
    }, 5000);
  }

  openConfigPage() {
    // Open the configuration page in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL('config.html')
    });
  }

  resetSettings() {
    this.settings = {
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
        },
        placeholders: {
          email: '[EMAIL_REDACTED]',
          phone: '[PHONE_REDACTED]',
          ssn: '[SSN_REDACTED]',
          creditCard: '[CREDIT_CARD_REDACTED]',
          apiKey: '[API_KEY_REDACTED]',
          ipAddress: '[IP_ADDRESS_REDACTED]',
          bankAccount: '[ACCOUNT_NUMBER_REDACTED]',
          passport: '[PASSPORT_REDACTED]',
          address: '[ADDRESS_REDACTED]'
        }
      };
    
    this.updateUI();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
