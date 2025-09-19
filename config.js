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

    // Action buttons
    document.getElementById('saveButton').addEventListener('click', () => this.saveSettings());
    document.getElementById('resetButton').addEventListener('click', () => this.resetSettings());
    document.getElementById('backToPopup').addEventListener('click', () => this.goBack());

    // CSV upload functionality
    this.setupCSVUpload();
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
    ignoreInput.value = '';
    this.updateIgnoreList();
    this.autoSave();
    this.showStatusMessage('Added to ignore list', 'success');
  }

  removeFromIgnoreList(text) {
    this.settings.ignoreList = this.settings.ignoreList.filter(item => item !== text);
    this.updateIgnoreList();
    this.autoSave();
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

    // Add unique patterns to ignore list
    let addedCount = 0;
    uniqueValues.forEach(pattern => {
      if (!this.settings.ignoreList.includes(pattern)) {
        this.settings.ignoreList.push(pattern);
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ConfigManager();
});
