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

    // Save button
    const saveButton = document.getElementById('saveButton');
    saveButton.addEventListener('click', () => this.saveSettings());

    // Reset button
    const resetButton = document.getElementById('resetButton');
    resetButton.addEventListener('click', () => this.resetSettings());
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

    this.updateStatus();
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
      }
    };
    
    this.updateUI();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
