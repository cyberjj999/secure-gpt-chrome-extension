class ConfigManager {
  constructor() {
    this.csvData = [];
    this.csvHeaders = [];
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
      ignoreList: [],
      ignoreListMetadata: {}, // Store metadata for each ignore item
      customPatterns: {
        hardcodedStrings: [], // Array of {string, placeholder, id}
        regexPatterns: [] // Array of {pattern, placeholder, name, id}
      }
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
      
      if (response && response.settings) {
        // Merge with existing settings, ensuring ignoreListMetadata exists
        this.settings = { 
          ...this.settings, 
          ...response.settings,
          ignoreListMetadata: response.settings.ignoreListMetadata || {}
        };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use defaults - ensure ignoreListMetadata exists
      if (!this.settings.ignoreListMetadata) {
        this.settings.ignoreListMetadata = {};
      }
    }
  }

  setupEventListeners() {
    // Main toggles
    document.getElementById('enabledToggle').addEventListener('change', (e) => {
      this.settings.enabled = e.target.checked;
      this.autoSave();
    });

    document.getElementById('notificationsToggle').addEventListener('change', (e) => {
      this.settings.showNotifications = e.target.checked;
      this.autoSave();
    });

    document.getElementById('autoScanToggle').addEventListener('change', (e) => {
      this.settings.autoScan = e.target.checked;
      this.autoSave();
    });

    // Pattern checkboxes
    Object.keys(this.settings.patterns).forEach(pattern => {
      const checkbox = document.getElementById(`pattern-${pattern}`);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          this.settings.patterns[pattern] = e.target.checked;
          this.autoSave();
        });
      }
    });

    // Placeholder inputs
    Object.keys(this.settings.placeholders).forEach(pattern => {
      const input = document.getElementById(`placeholder-${pattern}`);
      if (input) {
        input.addEventListener('input', (e) => {
          this.settings.placeholders[pattern] = e.target.value || this.settings.placeholders[pattern];
          this.autoSave();
        });
      }
    });

    // Website checkboxes
    Object.keys(this.settings.websites).forEach(website => {
      const checkbox = document.getElementById(`website-${website}`);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          this.settings.websites[website] = e.target.checked;
          this.autoSave();
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

    // Enhanced ignore list controls
    const ignoreSearchInput = document.getElementById('ignoreSearchInput');
    const ignoreFilterSelect = document.getElementById('ignoreFilterSelect');
    const ignoreSortSelect = document.getElementById('ignoreSortSelect');

    if (ignoreSearchInput) {
      ignoreSearchInput.addEventListener('input', () => {
        this.filterIgnoreList();
      });
    }

    if (ignoreFilterSelect) {
      ignoreFilterSelect.addEventListener('change', () => {
        this.filterIgnoreList();
      });
    }

    if (ignoreSortSelect) {
      ignoreSortSelect.addEventListener('change', () => {
        this.sortIgnoreList();
      });
    }

    // Action buttons
    document.getElementById('saveButton').addEventListener('click', () => this.saveSettings());
    document.getElementById('resetButton').addEventListener('click', () => this.resetSettings());
    document.getElementById('backToPopup').addEventListener('click', () => this.goBack());

    // CSV upload functionality
    this.setupCSVUpload();
    
    // Custom patterns functionality
    this.setupCustomPatterns();
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
    
    // Update custom patterns
    this.updateCustomPatterns();
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
    const testContainer = document.querySelector(`#test-${patternName}`).parentNode.parentNode; // Go up to col-test
    const existingResult = testContainer.querySelector('.test-result');
    if (existingResult) {
      existingResult.remove();
    }

    // Create new result
    const result = document.createElement('div');
    result.className = `test-result ${type}`;
    result.textContent = message;
    
    // Insert at the beginning of the test container (above test-group)
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

  async autoSave() {
    try {
      await chrome.storage.sync.set({
        secureGptSettings: this.settings
      });
      this.showAutoSaveNotification();
    } catch (error) {
      console.error('Auto-save failed:', error);
      this.showStatusMessage('Failed to save settings', 'error');
    }
  }

  showAutoSaveNotification() {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = 'auto-save-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">✓</span>
        <span class="notification-text">Settings saved automatically</span>
      </div>
    `;
    
    // Add to the page
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Remove after 2 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 2000);
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
    
    // Ensure ignoreListMetadata exists
    if (!this.settings.ignoreListMetadata) {
      this.settings.ignoreListMetadata = {};
    }
    
    // Add metadata for the new item
    const itemId = Date.now().toString();
    this.settings.ignoreListMetadata[text] = {
      id: itemId,
      source: 'manual',
      type: this.detectPatternType(text),
      addedDate: new Date().toISOString(),
      description: this.generateDescription(text)
    };
    
    ignoreInput.value = '';
    this.updateIgnoreList();
    this.autoSave();
    this.showStatusMessage('Added to ignore list', 'success');
  }

  removeFromIgnoreList(text) {
    this.settings.ignoreList = this.settings.ignoreList.filter(item => item !== text);
    
    // Clean up metadata
    if (this.settings.ignoreListMetadata[text]) {
      delete this.settings.ignoreListMetadata[text];
    }
    
    this.updateIgnoreList();
    this.autoSave();
    this.showStatusMessage('Removed from ignore list', 'success');
  }

  updateIgnoreList() {
    const ignoreListDiv = document.getElementById('ignoreList');
    const ignoreListCount = document.getElementById('ignoreListCount');
    const ignoreListSource = document.getElementById('ignoreListSource');
    
    ignoreListDiv.innerHTML = '';
    
    if (this.settings.ignoreList.length === 0) {
      ignoreListDiv.innerHTML = `
        <div class="ignore-list-empty">
          <div class="ignore-list-empty-icon">📝</div>
          <div class="ignore-list-empty-title">No items in ignore list</div>
          <div class="ignore-list-empty-description">Add patterns manually or import from CSV to get started</div>
        </div>
      `;
      ignoreListCount.textContent = '0 items';
      ignoreListSource.textContent = '0 manual, 0 CSV';
      return;
    }
    
    // Get filtered and sorted items
    const filteredItems = this.getFilteredIgnoreItems();
    const sortedItems = this.getSortedIgnoreItems(filteredItems);
    
    // Group items by source
    const groupedItems = this.groupIgnoreItemsBySource(sortedItems);
    
    // Update statistics
    const manualCount = this.settings.ignoreList.filter(item => 
      this.settings.ignoreListMetadata[item]?.source === 'manual'
    ).length;
    const csvCount = this.settings.ignoreList.length - manualCount;
    
    ignoreListCount.textContent = `${this.settings.ignoreList.length} items`;
    ignoreListSource.textContent = `${manualCount} manual, ${csvCount} CSV`;
    
    // Render grouped items
    Object.keys(groupedItems).forEach(source => {
      if (groupedItems[source].length === 0) return;
      
      // Add group header
      const headerDiv = document.createElement('div');
      headerDiv.className = `ignore-group-header ${source}`;
      headerDiv.textContent = `${source.charAt(0).toUpperCase() + source.slice(1)} Entries (${groupedItems[source].length})`;
      ignoreListDiv.appendChild(headerDiv);
      
      // Add items in this group
      groupedItems[source].forEach(text => {
        const itemDiv = this.createIgnoreItemElement(text);
        ignoreListDiv.appendChild(itemDiv);
      });
    });
  }

  createIgnoreItemElement(text) {
    // Ensure ignoreListMetadata exists
    if (!this.settings.ignoreListMetadata) {
      this.settings.ignoreListMetadata = {};
    }
    
    const metadata = this.settings.ignoreListMetadata[text] || {
      source: 'manual',
      type: 'other',
      addedDate: new Date().toISOString(),
      description: ''
    };
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'ignore-item';
    itemDiv.innerHTML = `
      <div class="ignore-item-content">
        <div class="ignore-item-main">
          <span class="ignore-item-text" title="${text}">${text}</span>
          <div class="ignore-item-badges">
            <span class="ignore-item-badge ${metadata.source}">${metadata.source}</span>
            <span class="ignore-item-badge ${metadata.type}">${metadata.type}</span>
          </div>
        </div>
        <div class="ignore-item-meta">
          <div class="ignore-item-source">
            <span>📅</span>
            <span class="ignore-item-date">${this.formatDate(metadata.addedDate)}</span>
          </div>
          ${metadata.description ? `<span>${metadata.description}</span>` : ''}
        </div>
      </div>
      <div class="ignore-item-actions">
        <button class="ignore-item-edit" onclick="configManager.editIgnoreItem('${text}')" title="Edit">✏️</button>
        <button class="ignore-item-remove" onclick="configManager.removeFromIgnoreList('${text}')" title="Remove">×</button>
      </div>
    `;
    
    return itemDiv;
  }

  detectPatternType(text) {
    // Email pattern
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'email';
    
    // Phone pattern
    if (/^[\+]?[1-9][\d]{0,15}$/.test(text) || /^[\+]?[1-9][\d\s\-\(\)]{7,}$/.test(text)) return 'phone';
    
    // SSN pattern
    if (/^\d{3}-\d{2}-\d{4}$/.test(text)) return 'ssn';
    
    // Credit card pattern
    if (/^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/.test(text)) return 'creditcard';
    
    // URL pattern
    if (/^https?:\/\/.+/.test(text)) return 'url';
    
    // IP address pattern
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(text)) return 'ip';
    
    return 'other';
  }

  generateDescription(text) {
    const type = this.detectPatternType(text);
    const descriptions = {
      email: 'Email address',
      phone: 'Phone number',
      ssn: 'Social Security Number',
      creditcard: 'Credit card number',
      url: 'Web URL',
      ip: 'IP address',
      other: 'Text pattern'
    };
    return descriptions[type] || 'Text pattern';
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  }

  getFilteredIgnoreItems() {
    const searchTerm = document.getElementById('ignoreSearchInput')?.value.toLowerCase() || '';
    const filterType = document.getElementById('ignoreFilterSelect')?.value || 'all';
    
    // Ensure ignoreListMetadata exists
    if (!this.settings.ignoreListMetadata) {
      this.settings.ignoreListMetadata = {};
    }
    
    return this.settings.ignoreList.filter(text => {
      const metadata = this.settings.ignoreListMetadata[text] || { source: 'manual', type: 'other' };
      
      // Search filter
      const matchesSearch = text.toLowerCase().includes(searchTerm) || 
                           metadata.description.toLowerCase().includes(searchTerm);
      
      // Source filter
      const matchesSource = filterType === 'all' || metadata.source === filterType;
      
      return matchesSearch && matchesSource;
    });
  }

  getSortedIgnoreItems(items) {
    const sortType = document.getElementById('ignoreSortSelect')?.value || 'added';
    
    // Ensure ignoreListMetadata exists
    if (!this.settings.ignoreListMetadata) {
      this.settings.ignoreListMetadata = {};
    }
    
    return items.sort((a, b) => {
      const metadataA = this.settings.ignoreListMetadata[a] || { addedDate: new Date().toISOString(), type: 'other' };
      const metadataB = this.settings.ignoreListMetadata[b] || { addedDate: new Date().toISOString(), type: 'other' };
      
      switch (sortType) {
        case 'alphabetical':
          return a.localeCompare(b);
        case 'type':
          return metadataA.type.localeCompare(metadataB.type);
        case 'added':
        default:
          return new Date(metadataB.addedDate) - new Date(metadataA.addedDate);
      }
    });
  }

  groupIgnoreItemsBySource(items) {
    const groups = { manual: [], csv: [] };
    
    // Ensure ignoreListMetadata exists
    if (!this.settings.ignoreListMetadata) {
      this.settings.ignoreListMetadata = {};
    }
    
    items.forEach(text => {
      const metadata = this.settings.ignoreListMetadata[text] || { source: 'manual' };
      groups[metadata.source].push(text);
    });
    
    return groups;
  }

  filterIgnoreList() {
    this.updateIgnoreList();
  }

  sortIgnoreList() {
    this.updateIgnoreList();
  }

  editIgnoreItem(text) {
    const newText = prompt('Edit ignore pattern:', text);
    if (newText && newText !== text && newText.trim()) {
      const trimmedNewText = newText.trim();
      
      if (this.settings.ignoreList.includes(trimmedNewText)) {
        this.showStatusMessage('Pattern already exists', 'warning');
        return;
      }
      
      // Update the list
      const index = this.settings.ignoreList.indexOf(text);
      this.settings.ignoreList[index] = trimmedNewText;
      
      // Update metadata
      if (this.settings.ignoreListMetadata[text]) {
        this.settings.ignoreListMetadata[trimmedNewText] = {
          ...this.settings.ignoreListMetadata[text],
          addedDate: new Date().toISOString()
        };
        delete this.settings.ignoreListMetadata[text];
      }
      
      this.updateIgnoreList();
      this.autoSave();
      this.showStatusMessage('Pattern updated', 'success');
    }
  }

  goBack() {
    // Close the current tab and return to the extension popup
    window.close();
  }

  setupCSVUpload() {
    // Initialize CSV selection tracking
    this.csvSelectedCells = new Set();
    this.csvSelectedRows = new Set();
    this.csvSelectedColumns = new Set();
    this.csvSelectionMode = 'cell'; // 'cell', 'row', 'column'

    // Get DOM elements
    const csvFileInput = document.getElementById('csvFileInput');
    const csvOptions = document.getElementById('csvOptions');
    const csvImportBtn = document.getElementById('csvImportBtn');
    const csvCancelBtn = document.getElementById('csvCancelBtn');
    const csvExportBtn = document.getElementById('csvExportBtn');

    // Control buttons
    const selectAllBtn = document.getElementById('selectAllBtn');
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');
    const selectRowsBtn = document.getElementById('selectRowsBtn');
    const selectColumnsBtn = document.getElementById('selectColumnsBtn');
    
    // Options
    const treatFirstRowAsHeader = document.getElementById('treatFirstRowAsHeader');
    const showRowNumbers = document.getElementById('showRowNumbers');

    // File input change handler
    csvFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.csv')) {
        this.showStatusMessage('Please select a CSV file', 'error');
        return;
      }

      this.parseCSVFile(file);
    });

    // Control button handlers
    selectAllBtn.addEventListener('click', () => this.selectAllCells());
    clearSelectionBtn.addEventListener('click', () => this.clearAllSelections());
    selectRowsBtn.addEventListener('click', () => this.toggleSelectionMode('row'));
    selectColumnsBtn.addEventListener('click', () => this.toggleSelectionMode('column'));

    // Option handlers
    treatFirstRowAsHeader.addEventListener('change', () => this.renderCSVTable());
    showRowNumbers.addEventListener('change', () => this.renderCSVTable());

    // Import/Cancel handlers
    csvImportBtn.addEventListener('click', () => this.importSelectedCSVData());
    csvCancelBtn.addEventListener('click', () => this.cancelCSVUpload());

    // Export button handler
    csvExportBtn.addEventListener('click', () => this.exportIgnoreListToCSV());
  }

  parseCSVFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          this.showStatusMessage('CSV file is empty', 'error');
          return;
        }

        // Parse CSV (simple implementation)
        this.csvData = lines.map(line => {
          // Handle quoted fields and commas
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        });

        this.csvHeaders = this.csvData[0] || [];
        this.renderCSVTable();
        this.showCSVOptions();
        
      } catch (error) {
        console.error('Error parsing CSV:', error);
        this.showStatusMessage('Error parsing CSV file', 'error');
      }
    };
    
    reader.readAsText(file);
  }

  renderCSVTable() {
    if (!this.csvData || this.csvData.length === 0) return;

    const table = document.getElementById('csvInteractiveTable');
    const thead = document.getElementById('csvTableHead');
    const tbody = document.getElementById('csvTableBody');
    const treatFirstRowAsHeader = document.getElementById('treatFirstRowAsHeader').checked;
    const showRowNumbers = document.getElementById('showRowNumbers').checked;

    // Clear existing content
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Update info
    this.updateCSVInfo();

    // Create header row
    const headerRow = document.createElement('tr');
    
    // Add row number header if enabled
    if (showRowNumbers) {
      const th = document.createElement('th');
      th.textContent = '#';
      th.className = 'row-header';
      headerRow.appendChild(th);
    }

    // Determine data start index and headers
    const dataStartIndex = treatFirstRowAsHeader ? 1 : 0;
    const headers = treatFirstRowAsHeader ? this.csvData[0] : [];
    const maxCols = Math.max(...this.csvData.map(row => row.length));

    // Create column headers
    for (let col = 0; col < maxCols; col++) {
      const th = document.createElement('th');
      th.textContent = headers[col] || `Column ${col + 1}`;
      th.dataset.col = col;
      th.addEventListener('click', (e) => this.handleColumnHeaderClick(e, col));
      headerRow.appendChild(th);
    }
    
    thead.appendChild(headerRow);

    // Create data rows
    for (let row = dataStartIndex; row < this.csvData.length; row++) {
      const tr = document.createElement('tr');
      tr.dataset.row = row;

      // Add row number if enabled
      if (showRowNumbers) {
        const td = document.createElement('td');
        td.textContent = row + 1;
        td.className = 'row-header';
        td.addEventListener('click', (e) => this.handleRowHeaderClick(e, row));
        tr.appendChild(td);
      }

      // Add data cells
      for (let col = 0; col < maxCols; col++) {
        const td = document.createElement('td');
        const cellValue = this.csvData[row] && this.csvData[row][col] || '';
        td.textContent = cellValue;
        td.dataset.row = row;
        td.dataset.col = col;
        td.title = cellValue; // Tooltip for long values
        
        // Add selection indicator
        const indicator = document.createElement('div');
        indicator.className = 'selection-indicator';
        td.appendChild(indicator);
        
        td.addEventListener('click', (e) => this.handleCellClick(e, row, col));
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    // Clear selections when table is re-rendered
    this.clearAllSelections();
  }

  updateCSVInfo() {
    const rowCount = document.getElementById('csvRowCount');
    const colCount = document.getElementById('csvColCount');
    const selectedCount = document.getElementById('csvSelectedCount');

    const treatFirstRowAsHeader = document.getElementById('treatFirstRowAsHeader').checked;
    const dataRows = treatFirstRowAsHeader ? this.csvData.length - 1 : this.csvData.length;
    const maxCols = Math.max(...this.csvData.map(row => row.length));

    rowCount.textContent = `${dataRows} rows`;
    colCount.textContent = `${maxCols} columns`;
    selectedCount.textContent = `${this.csvSelectedCells.size} selected`;
  }

  handleCellClick(e, row, col) {
    e.stopPropagation();
    const cellKey = `${row}-${col}`;
    const cell = e.target;

    if (this.csvSelectionMode === 'row') {
      this.toggleRowSelection(row);
    } else if (this.csvSelectionMode === 'column') {
      this.toggleColumnSelection(col);
    } else {
      // Cell selection mode
      if (this.csvSelectedCells.has(cellKey)) {
        this.csvSelectedCells.delete(cellKey);
        cell.classList.remove('selected');
      } else {
        this.csvSelectedCells.add(cellKey);
        cell.classList.add('selected');
      }
    }

    this.updateSelectionUI();
  }

  handleRowHeaderClick(e, row) {
    e.stopPropagation();
    this.toggleRowSelection(row);
    this.updateSelectionUI();
  }

  handleColumnHeaderClick(e, col) {
    e.stopPropagation();
    this.toggleColumnSelection(col);
    this.updateSelectionUI();
  }

  showCSVOptions() {
    const csvOptions = document.getElementById('csvOptions');
    csvOptions.style.display = 'block';
  }

  updateCSVPreview() {
    const csvColumnSelect = document.getElementById('csvColumnSelect');
    const csvSkipHeader = document.getElementById('csvSkipHeader');
    const csvStartRow = document.getElementById('csvStartRow');
    const csvEndRow = document.getElementById('csvEndRow');
    const csvPreview = document.getElementById('csvPreview');
    const csvPreviewTable = document.getElementById('csvPreviewTable');

    const selectedColumn = parseInt(csvColumnSelect.value);
    if (isNaN(selectedColumn)) {
      csvPreview.style.display = 'none';
      return;
    }

    const skipHeader = csvSkipHeader.checked;
    const startRow = parseInt(csvStartRow.value) || 1;
    const endRow = parseInt(csvEndRow.value) || this.csvData.length;

    // Calculate actual start and end indices
    let actualStart = skipHeader ? 1 : 0;
    let actualEnd = this.csvData.length;

    if (startRow > 0) {
      actualStart = Math.max(actualStart, startRow - 1);
    }
    if (endRow > 0) {
      actualEnd = Math.min(actualEnd, endRow);
    }

    // Get preview data
    const previewData = this.csvData.slice(actualStart, Math.min(actualStart + 5, actualEnd));
    
    // Clear and populate preview table
    csvPreviewTable.innerHTML = '';
    
    previewData.forEach((row, index) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'csv-preview-row';
      
      const rowNumber = document.createElement('div');
      rowNumber.className = 'csv-preview-row-number';
      rowNumber.textContent = actualStart + index + 1;
      
      const rowData = document.createElement('div');
      rowData.className = 'csv-preview-row-data';
      rowData.textContent = row[selectedColumn] || '';
      
      rowDiv.appendChild(rowNumber);
      rowDiv.appendChild(rowData);
      csvPreviewTable.appendChild(rowDiv);
    });

    csvPreview.style.display = 'block';
  }

  updateImportButton() {
    const csvColumnSelect = document.getElementById('csvColumnSelect');
    const csvImportBtn = document.getElementById('csvImportBtn');
    
    csvImportBtn.disabled = !csvColumnSelect.value;
  }

  importCSVPatterns() {
    const csvColumnSelect = document.getElementById('csvColumnSelect');
    const csvSkipHeader = document.getElementById('csvSkipHeader');
    const csvStartRow = document.getElementById('csvStartRow');
    const csvEndRow = document.getElementById('csvEndRow');

    const selectedColumn = parseInt(csvColumnSelect.value);
    if (isNaN(selectedColumn)) {
      this.showStatusMessage('Please select a column', 'error');
      return;
    }

    const skipHeader = csvSkipHeader.checked;
    const startRow = parseInt(csvStartRow.value) || 1;
    const endRow = parseInt(csvEndRow.value) || this.csvData.length;

    // Calculate actual start and end indices
    let actualStart = skipHeader ? 1 : 0;
    let actualEnd = this.csvData.length;

    if (startRow > 0) {
      actualStart = Math.max(actualStart, startRow - 1);
    }
    if (endRow > 0) {
      actualEnd = Math.min(actualEnd, endRow);
    }

    // Extract patterns from selected column
    const patterns = [];
    for (let i = actualStart; i < actualEnd; i++) {
      const value = this.csvData[i] && this.csvData[i][selectedColumn];
      if (value && value.trim()) {
        patterns.push(value.trim());
      }
    }

    if (patterns.length === 0) {
      this.showStatusMessage('No valid patterns found in selected range', 'warning');
      return;
    }

    // Add patterns to ignore list (avoiding duplicates)
    let addedCount = 0;
    patterns.forEach(pattern => {
      if (!this.settings.ignoreList.includes(pattern)) {
        this.settings.ignoreList.push(pattern);
        addedCount++;
      }
    });

    this.updateIgnoreList();
    this.autoSave();
    this.showStatusMessage(`Successfully imported ${addedCount} patterns to ignore list`, 'success');
    this.cancelCSVUpload();
  }

  cancelCSVUpload() {
    const csvFileInput = document.getElementById('csvFileInput');
    const csvOptions = document.getElementById('csvOptions');
    const csvPreview = document.getElementById('csvPreview');
    const csvColumnSelect = document.getElementById('csvColumnSelect');
    const csvSkipHeader = document.getElementById('csvSkipHeader');
    const csvStartRow = document.getElementById('csvStartRow');
    const csvEndRow = document.getElementById('csvEndRow');
    const csvImportBtn = document.getElementById('csvImportBtn');

    // Reset form
    csvFileInput.value = '';
    csvOptions.style.display = 'none';
    csvPreview.style.display = 'none';
    csvColumnSelect.innerHTML = '<option value="">Select column...</option>';
    csvSkipHeader.checked = false;
    csvStartRow.value = '';
    csvEndRow.value = '';
    csvImportBtn.disabled = true;

    // Clear data and selections
    this.csvData = [];
    this.csvHeaders = [];
    if (this.csvSelectedCells) this.csvSelectedCells.clear();
    if (this.csvSelectedRows) this.csvSelectedRows.clear();
    if (this.csvSelectedColumns) this.csvSelectedColumns.clear();
  }

  // New interactive table methods
  toggleRowSelection(row) {
    const table = document.getElementById('csvInteractiveTable');
    const rowElement = table.querySelector(`tr[data-row="${row}"]`);
    
    if (this.csvSelectedRows.has(row)) {
      // Deselect row
      this.csvSelectedRows.delete(row);
      rowElement.classList.remove('row-selected');
      
      // Remove cells from selection
      const cells = rowElement.querySelectorAll('td[data-col]');
      cells.forEach(cell => {
        const cellKey = `${row}-${cell.dataset.col}`;
        this.csvSelectedCells.delete(cellKey);
        cell.classList.remove('selected');
      });
    } else {
      // Select row
      this.csvSelectedRows.add(row);
      rowElement.classList.add('row-selected');
      
      // Add cells to selection
      const cells = rowElement.querySelectorAll('td[data-col]');
      cells.forEach(cell => {
        const cellKey = `${row}-${cell.dataset.col}`;
        this.csvSelectedCells.add(cellKey);
        cell.classList.add('selected');
      });
    }
  }

  toggleColumnSelection(col) {
    const table = document.getElementById('csvInteractiveTable');
    const columnHeader = table.querySelector(`th[data-col="${col}"]`);
    const columnCells = table.querySelectorAll(`td[data-col="${col}"]`);
    
    if (this.csvSelectedColumns.has(col)) {
      // Deselect column
      this.csvSelectedColumns.delete(col);
      columnHeader.classList.remove('col-selected');
      
      columnCells.forEach(cell => {
        const cellKey = `${cell.dataset.row}-${col}`;
        this.csvSelectedCells.delete(cellKey);
        cell.classList.remove('selected', 'col-selected');
      });
    } else {
      // Select column
      this.csvSelectedColumns.add(col);
      columnHeader.classList.add('col-selected');
      
      columnCells.forEach(cell => {
        const cellKey = `${cell.dataset.row}-${col}`;
        this.csvSelectedCells.add(cellKey);
        cell.classList.add('selected', 'col-selected');
      });
    }
  }

  selectAllCells() {
    const treatFirstRowAsHeader = document.getElementById('treatFirstRowAsHeader').checked;
    const dataStartIndex = treatFirstRowAsHeader ? 1 : 0;
    const maxCols = Math.max(...this.csvData.map(row => row.length));

    // Clear existing selections
    this.clearAllSelections();

    // Select all data cells
    for (let row = dataStartIndex; row < this.csvData.length; row++) {
      for (let col = 0; col < maxCols; col++) {
        const cellKey = `${row}-${col}`;
        this.csvSelectedCells.add(cellKey);
      }
    }

    // Update UI
    const table = document.getElementById('csvInteractiveTable');
    const cells = table.querySelectorAll('td[data-col]');
    cells.forEach(cell => {
      cell.classList.add('selected');
    });

    this.updateSelectionUI();
  }

  clearAllSelections() {
    this.csvSelectedCells.clear();
    this.csvSelectedRows.clear();
    this.csvSelectedColumns.clear();

    // Clear UI
    const table = document.getElementById('csvInteractiveTable');
    if (table) {
      const selectedElements = table.querySelectorAll('.selected, .row-selected, .col-selected');
      selectedElements.forEach(el => {
        el.classList.remove('selected', 'row-selected', 'col-selected');
      });
    }

    this.updateSelectionUI();
  }

  toggleSelectionMode(mode) {
    // Update button states
    const selectRowsBtn = document.getElementById('selectRowsBtn');
    const selectColumnsBtn = document.getElementById('selectColumnsBtn');
    
    selectRowsBtn.classList.remove('active');
    selectColumnsBtn.classList.remove('active');

    if (this.csvSelectionMode === mode) {
      // Toggle off
      this.csvSelectionMode = 'cell';
    } else {
      // Switch mode
      this.csvSelectionMode = mode;
      if (mode === 'row') {
        selectRowsBtn.classList.add('active');
      } else if (mode === 'column') {
        selectColumnsBtn.classList.add('active');
      }
    }
  }

  updateSelectionUI() {
    // Update counters
    this.updateCSVInfo();
    
    // Update import button
    const csvImportBtn = document.getElementById('csvImportBtn');
    const importCount = document.getElementById('importCount');
    const hasSelection = this.csvSelectedCells.size > 0;
    
    csvImportBtn.disabled = !hasSelection;
    importCount.textContent = this.csvSelectedCells.size;

    // Update selection summary
    this.updateSelectionSummary();
  }

  updateSelectionSummary() {
    const summaryDiv = document.getElementById('csvSelectionSummary');
    const selectedCellsCount = document.getElementById('selectedCellsCount');
    const uniqueValuesCount = document.getElementById('uniqueValuesCount');
    const previewValues = document.getElementById('previewValues');

    if (this.csvSelectedCells.size === 0) {
      summaryDiv.style.display = 'none';
      return;
    }

    // Get selected values
    const values = [];
    this.csvSelectedCells.forEach(cellKey => {
      const [row, col] = cellKey.split('-').map(Number);
      const value = this.csvData[row] && this.csvData[row][col];
      if (value && value.trim()) {
        values.push(value.trim());
      }
    });

    const uniqueValues = [...new Set(values)];
    
    selectedCellsCount.textContent = this.csvSelectedCells.size;
    uniqueValuesCount.textContent = uniqueValues.length;

    // Show preview of values (first 20)
    previewValues.innerHTML = '';
    const previewLimit = Math.min(20, uniqueValues.length);
    
    for (let i = 0; i < previewLimit; i++) {
      const span = document.createElement('span');
      span.className = 'preview-value';
      span.textContent = uniqueValues[i];
      span.title = uniqueValues[i];
      previewValues.appendChild(span);
    }

    if (uniqueValues.length > previewLimit) {
      const more = document.createElement('span');
      more.className = 'preview-value';
      more.textContent = `+${uniqueValues.length - previewLimit} more...`;
      more.style.fontStyle = 'italic';
      previewValues.appendChild(more);
    }

    summaryDiv.style.display = 'block';
  }

  importSelectedCSVData() {
    if (this.csvSelectedCells.size === 0) {
      this.showStatusMessage('Please select some cells to import', 'warning');
      return;
    }

    // Get selected values
    const values = [];
    this.csvSelectedCells.forEach(cellKey => {
      const [row, col] = cellKey.split('-').map(Number);
      const value = this.csvData[row] && this.csvData[row][col];
      if (value && value.trim()) {
        values.push(value.trim());
      }
    });

    const uniqueValues = [...new Set(values)];
    
    if (uniqueValues.length === 0) {
      this.showStatusMessage('No valid values found in selection', 'warning');
      return;
    }

    // Ensure ignoreListMetadata exists
    if (!this.settings.ignoreListMetadata) {
      this.settings.ignoreListMetadata = {};
    }

    // Add unique patterns to ignore list
    let addedCount = 0;
    uniqueValues.forEach(pattern => {
      if (!this.settings.ignoreList.includes(pattern)) {
        this.settings.ignoreList.push(pattern);
        
        // Add metadata for CSV imported items
        this.settings.ignoreListMetadata[pattern] = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          source: 'csv',
          type: this.detectPatternType(pattern),
          addedDate: new Date().toISOString(),
          description: this.generateDescription(pattern),
          csvImport: {
            fileName: 'CSV Import',
            importDate: new Date().toISOString()
          }
        };
        
        addedCount++;
      }
    });

    // Save settings and update UI
    this.saveSettings();
    this.renderIgnoreList();
    this.cancelCSVUpload();

    this.showStatusMessage(`Added ${addedCount} new patterns to ignore list (${uniqueValues.length - addedCount} duplicates skipped)`, 'success');
  }

  exportIgnoreListToCSV() {
    if (this.settings.ignoreList.length === 0) {
      this.showStatusMessage('No patterns in ignore list to export', 'warning');
      return;
    }

    // Create CSV content
    const headers = ['Pattern'];
    const csvContent = [
      headers.join(','),
      ...this.settings.ignoreList.map(pattern => `"${pattern.replace(/"/g, '""')}"`)
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `securegpt-ignore-list-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showStatusMessage('Ignore list exported successfully', 'success');
  }

  setupCustomPatterns() {
    // Hardcoded strings functionality
    const addHardcodedBtn = document.getElementById('addHardcodedBtn');
    const hardcodedStringInput = document.getElementById('hardcodedStringInput');
    const hardcodedPlaceholderInput = document.getElementById('hardcodedPlaceholderInput');
    
    addHardcodedBtn.addEventListener('click', () => {
      this.addHardcodedString();
    });
    
    hardcodedStringInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addHardcodedString();
      }
    });
    
    hardcodedPlaceholderInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addHardcodedString();
      }
    });

    // Regex patterns functionality
    const addRegexBtn = document.getElementById('addRegexBtn');
    const regexPatternInput = document.getElementById('regexPatternInput');
    const regexPlaceholderInput = document.getElementById('regexPlaceholderInput');
    const regexNameInput = document.getElementById('regexNameInput');
    const testRegexBtn = document.getElementById('testRegexBtn');
    const regexTestInput = document.getElementById('regexTestInput');
    
    addRegexBtn.addEventListener('click', () => {
      this.addRegexPattern();
    });
    
    [regexPatternInput, regexPlaceholderInput, regexNameInput].forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addRegexPattern();
        }
      });
    });
    
    testRegexBtn.addEventListener('click', () => {
      this.testRegexPattern();
    });
    
    regexTestInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.testRegexPattern();
      }
    });
  }

  addHardcodedString() {
    const stringInput = document.getElementById('hardcodedStringInput');
    const placeholderInput = document.getElementById('hardcodedPlaceholderInput');
    
    const string = stringInput.value.trim();
    const placeholder = placeholderInput.value.trim();
    
    if (!string) {
      this.showStatusMessage('Please enter text to replace', 'warning');
      return;
    }
    
    if (!placeholder) {
      this.showStatusMessage('Please enter a replacement placeholder', 'warning');
      return;
    }
    
    // Check for duplicates
    if (this.settings.customPatterns.hardcodedStrings.some(item => item.string === string)) {
      this.showStatusMessage('This text is already in the list', 'warning');
      return;
    }
    
    // Add to settings
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    this.settings.customPatterns.hardcodedStrings.push({
      id,
      string,
      placeholder
    });
    
    // Clear inputs
    stringInput.value = '';
    placeholderInput.value = '';
    
    // Update UI and save
    this.updateCustomPatterns();
    this.autoSave();
    this.showStatusMessage('Text pattern added successfully', 'success');
  }

  addRegexPattern() {
    const patternInput = document.getElementById('regexPatternInput');
    const placeholderInput = document.getElementById('regexPlaceholderInput');
    const nameInput = document.getElementById('regexNameInput');
    
    const pattern = patternInput.value.trim();
    const placeholder = placeholderInput.value.trim();
    const name = nameInput.value.trim();
    
    if (!pattern) {
      this.showStatusMessage('Please enter a regex pattern', 'warning');
      return;
    }
    
    if (!placeholder) {
      this.showStatusMessage('Please enter a replacement placeholder', 'warning');
      return;
    }
    
    if (!name) {
      this.showStatusMessage('Please enter a pattern name', 'warning');
      return;
    }
    
    // Validate regex pattern
    try {
      new RegExp(pattern, 'g');
    } catch (error) {
      this.showStatusMessage('Invalid regex pattern: ' + error.message, 'error');
      return;
    }
    
    // Check for duplicates
    if (this.settings.customPatterns.regexPatterns.some(item => item.pattern === pattern)) {
      this.showStatusMessage('This regex pattern is already in the list', 'warning');
      return;
    }
    
    // Add to settings
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    this.settings.customPatterns.regexPatterns.push({
      id,
      pattern,
      placeholder,
      name
    });
    
    // Clear inputs
    patternInput.value = '';
    placeholderInput.value = '';
    nameInput.value = '';
    
    // Update UI and save
    this.updateCustomPatterns();
    this.autoSave();
    this.showStatusMessage('Regex pattern added successfully', 'success');
  }

  testRegexPattern() {
    const patternInput = document.getElementById('regexPatternInput');
    const testInput = document.getElementById('regexTestInput');
    
    const pattern = patternInput.value.trim();
    const testText = testInput.value.trim();
    
    if (!pattern) {
      this.showStatusMessage('Please enter a regex pattern to test', 'warning');
      return;
    }
    
    if (!testText) {
      this.showStatusMessage('Please enter text to test against', 'warning');
      return;
    }
    
    try {
      const regex = new RegExp(pattern, 'g');
      const matches = testText.match(regex);
      
      if (matches) {
        const placeholder = document.getElementById('regexPlaceholderInput').value.trim() || '[REDACTED]';
        const result = testText.replace(regex, placeholder);
        this.showStatusMessage(`Pattern matches! Found ${matches.length} match(es). Result: "${result}"`, 'detected');
      } else {
        this.showStatusMessage('Pattern does not match the test text', 'safe');
      }
    } catch (error) {
      this.showStatusMessage('Invalid regex pattern: ' + error.message, 'error');
    }
  }

  removeHardcodedString(id) {
    this.settings.customPatterns.hardcodedStrings = this.settings.customPatterns.hardcodedStrings.filter(item => item.id !== id);
    this.updateCustomPatterns();
    this.autoSave();
    this.showStatusMessage('Text pattern removed', 'success');
  }

  removeRegexPattern(id) {
    this.settings.customPatterns.regexPatterns = this.settings.customPatterns.regexPatterns.filter(item => item.id !== id);
    this.updateCustomPatterns();
    this.autoSave();
    this.showStatusMessage('Regex pattern removed', 'success');
  }

  updateCustomPatterns() {
    // Update hardcoded strings list
    this.updateHardcodedStringsList();
    
    // Update regex patterns list
    this.updateRegexPatternsList();
  }

  updateHardcodedStringsList() {
    const listDiv = document.getElementById('customHardcodedList');
    listDiv.innerHTML = '';
    
    if (this.settings.customPatterns.hardcodedStrings.length === 0) {
      listDiv.innerHTML = `
        <div class="custom-patterns-empty">
          <div class="empty-icon">📝</div>
          <div class="empty-title">No text patterns added</div>
          <div class="empty-description">Add specific text or phrases to replace with placeholders</div>
        </div>
      `;
      return;
    }
    
    this.settings.customPatterns.hardcodedStrings.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'custom-pattern-item hardcoded-item';
      itemDiv.innerHTML = `
        <div class="pattern-item-content">
          <div class="pattern-item-main">
            <span class="pattern-string" title="${item.string}">"${item.string}"</span>
            <span class="pattern-arrow">→</span>
            <span class="pattern-placeholder" title="${item.placeholder}">"${item.placeholder}"</span>
          </div>
        </div>
        <div class="pattern-item-actions">
          <button class="pattern-remove" onclick="configManager.removeHardcodedString('${item.id}')" title="Remove">×</button>
        </div>
      `;
      listDiv.appendChild(itemDiv);
    });
  }

  updateRegexPatternsList() {
    const listDiv = document.getElementById('customRegexList');
    listDiv.innerHTML = '';
    
    if (this.settings.customPatterns.regexPatterns.length === 0) {
      listDiv.innerHTML = `
        <div class="custom-patterns-empty">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">No advanced patterns added</div>
          <div class="empty-description">Add regex patterns to detect and replace complex content formats</div>
        </div>
      `;
      return;
    }
    
    this.settings.customPatterns.regexPatterns.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'custom-pattern-item regex-item';
      itemDiv.innerHTML = `
        <div class="pattern-item-content">
          <div class="pattern-item-main">
            <span class="pattern-name">${item.name}</span>
            <span class="pattern-regex" title="${item.pattern}">${item.pattern}</span>
            <span class="pattern-arrow">→</span>
            <span class="pattern-placeholder" title="${item.placeholder}">"${item.placeholder}"</span>
          </div>
        </div>
        <div class="pattern-item-actions">
          <button class="pattern-remove" onclick="configManager.removeRegexPattern('${item.id}')" title="Remove">×</button>
        </div>
      `;
      listDiv.appendChild(itemDiv);
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ConfigManager();
});
