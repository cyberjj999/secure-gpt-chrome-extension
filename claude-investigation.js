// Claude.ai DOM Investigation Script
// Run this in the browser console on claude.ai to understand the DOM structure

(function() {
  console.log('🔍 Starting Claude.ai DOM Investigation...');

  const investigation = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    hostname: window.location.hostname,
    findings: {}
  };

  // 1. Look for input elements that might be the chat input
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
    '[data-cy*="prompt"]',
    '[data-cy*="input"]',
    '[data-cy*="textarea"]',
    '[data-cy*="message"]',
    // Common patterns for chat interfaces
    'div[class*="input"]',
    'div[class*="prompt"]',
    'div[class*="message"]',
    'div[class*="chat"]',
    'div[id*="input"]',
    'div[id*="prompt"]',
    'div[id*="message"]',
    'div[id*="chat"]'
  ];

  investigation.findings.inputElements = [];

  inputSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 20) { // Filter out very small elements
        investigation.findings.inputElements.push({
          selector: selector,
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          contentEditable: el.getAttribute('contenteditable'),
          role: el.getAttribute('role'),
          placeholder: el.getAttribute('placeholder'),
          'aria-label': el.getAttribute('aria-label'),
          'data-testid': el.getAttribute('data-testid'),
          'data-cy': el.getAttribute('data-cy'),
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

  // 2. Look for send/submit buttons
  const buttonSelectors = [
    'button[type="submit"]',
    'button[class*="send"]',
    'button[class*="submit"]',
    'button[id*="send"]',
    'button[id*="submit"]',
    '[data-testid*="send"]',
    '[data-testid*="submit"]',
    '[data-cy*="send"]',
    '[data-cy*="submit"]'
  ];

  investigation.findings.sendButtons = [];

  buttonSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      investigation.findings.sendButtons.push({
        selector: selector,
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        textContent: el.textContent,
        'data-testid': el.getAttribute('data-testid'),
        'data-cy': el.getAttribute('data-cy'),
        rect: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        },
        isVisible: rect.width > 0 && rect.height > 0 &&
                  getComputedStyle(el).visibility !== 'hidden' &&
                  getComputedStyle(el).display !== 'none'
      });
    });
  });

  // 3. Look for form elements
  investigation.findings.forms = [];
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    investigation.findings.forms.push({
      id: form.id,
      className: form.className,
      action: form.getAttribute('action'),
      method: form.getAttribute('method'),
      elements: Array.from(form.elements).map(el => ({
        tagName: el.tagName,
        type: el.type,
        name: el.name,
        id: el.id,
        className: el.className
      }))
    });
  });

  // 4. Look for any main chat container or conversation area
  const chatSelectors = [
    'main',
    '[role="main"]',
    'div[class*="main"]',
    'div[class*="chat"]',
    'div[class*="conversation"]',
    'div[id*="main"]',
    'div[id*="chat"]',
    'div[id*="conversation"]'
  ];

  investigation.findings.chatContainers = [];

  chatSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 300 && rect.height > 200) { // Filter out small containers
        investigation.findings.chatContainers.push({
          selector: selector,
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          role: el.getAttribute('role'),
          rect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          }
        });
      }
    });
  });

  // 5. Check if we're in the main chat interface (not just the landing page)
  investigation.findings.isChatPage = window.location.pathname !== '/' &&
                                     !window.location.pathname.includes('/new') &&
                                     document.querySelectorAll('[class*="message"], [class*="conversation"]').length > 0;

  // 6. Look at the current page structure
  investigation.findings.bodyStructure = {
    childrenCount: document.body.children.length,
    hasMainContent: !!document.querySelector('main'),
    hasContentEditable: !!document.querySelector('[contenteditable="true"]'),
    hasTextareas: !!document.querySelector('textarea'),
    hasRoleTextbox: !!document.querySelector('[role="textbox"]')
  };

  console.log('📊 Investigation Results:', investigation);

  // Make investigation available globally for further inspection
  window.claudeInvestigation = investigation;

  return investigation;
})();
