// DOM Investigation Script for SecureGPT
// This script should be run in the browser console on each target platform
// to understand the actual DOM structure

console.log('🔍 SecureGPT DOM Investigation Starting...');

function investigatePage() {
  const results = {
    url: window.location.href,
    hostname: window.location.hostname,
    timestamp: new Date().toISOString(),
    findings: {}
  };

  // 1. Find all potential input elements
  const inputSelectors = [
    'textarea',
    'input[type="text"]',
    'input:not([type])',
    '[contenteditable="true"]',
    '[contenteditable=""]',
    '[role="textbox"]',
    '[role="textbox"]',
    'div[contenteditable]',
    'div[role="textbox"]'
  ];

  console.log('📝 Searching for input elements...');
  const inputElements = [];
  inputSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 20) { // Only visible elements
        inputElements.push({
          selector: selector,
          element: el,
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          placeholder: el.placeholder,
          role: el.getAttribute('role'),
          contenteditable: el.getAttribute('contenteditable'),
          rect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          },
          visible: rect.width > 0 && rect.height > 0,
          parentElement: el.parentElement ? {
            tagName: el.parentElement.tagName,
            className: el.parentElement.className,
            id: el.parentElement.id
          } : null
        });
      }
    });
  });

  results.findings.inputElements = inputElements;
  console.log(`Found ${inputElements.length} potential input elements:`, inputElements);

  // 2. Find all buttons (potential send buttons)
  console.log('🔘 Searching for buttons...');
  const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
    text: btn.textContent.trim(),
    ariaLabel: btn.getAttribute('aria-label'),
    className: btn.className,
    id: btn.id,
    type: btn.type,
    disabled: btn.disabled,
    visible: btn.offsetParent !== null,
    rect: btn.getBoundingClientRect()
  }));

  results.findings.buttons = buttons;
  console.log(`Found ${buttons.length} buttons:`, buttons);

  // 3. Find forms
  console.log('📋 Searching for forms...');
  const forms = Array.from(document.querySelectorAll('form')).map(form => ({
    className: form.className,
    id: form.id,
    action: form.action,
    method: form.method,
    childCount: form.children.length
  }));

  results.findings.forms = forms;
  console.log(`Found ${forms.length} forms:`, forms);

  // 4. Look for specific AI platform patterns
  console.log('🤖 Looking for AI platform specific patterns...');
  
  // ChatGPT patterns
  if (window.location.hostname.includes('openai.com') || window.location.hostname.includes('chatgpt.com')) {
    const chatgptPatterns = {
      promptTextarea: document.querySelector('#prompt-textarea'),
      messageTextareas: document.querySelectorAll('textarea[placeholder*="message" i]'),
      sendButtons: document.querySelectorAll('button[data-testid*="send"]'),
      chatContainer: document.querySelector('[data-testid="conversation-turn"]')
    };
    results.findings.chatgptPatterns = chatgptPatterns;
    console.log('ChatGPT patterns:', chatgptPatterns);
  }

  // Claude patterns
  if (window.location.hostname.includes('claude.ai')) {
    const claudePatterns = {
      contentEditable: document.querySelectorAll('div[contenteditable="true"]'),
      textboxRole: document.querySelectorAll('div[role="textbox"]'),
      sendButtons: document.querySelectorAll('button[aria-label*="send" i]'),
      messageButtons: document.querySelectorAll('button[aria-label*="message" i]')
    };
    results.findings.claudePatterns = claudePatterns;
    console.log('Claude patterns:', claudePatterns);
  }

  // 5. Check for dynamic content loading
  console.log('⚡ Checking for dynamic content...');
  const dynamicElements = document.querySelectorAll('[data-testid], [data-cy], [data-qa]');
  results.findings.dynamicElements = Array.from(dynamicElements).map(el => ({
    tagName: el.tagName,
    testId: el.getAttribute('data-testid'),
    cy: el.getAttribute('data-cy'),
    qa: el.getAttribute('data-qa'),
    className: el.className,
    id: el.id
  }));

  console.log(`Found ${dynamicElements.length} elements with test attributes:`, results.findings.dynamicElements);

  // 6. Look for common chat UI patterns
  console.log('💬 Looking for chat UI patterns...');
  const chatPatterns = {
    messageContainers: document.querySelectorAll('[class*="message"], [class*="chat"], [class*="conversation"]'),
    inputContainers: document.querySelectorAll('[class*="input"], [class*="prompt"], [class*="compose"]'),
    sendContainers: document.querySelectorAll('[class*="send"], [class*="submit"], [class*="button"]')
  };

  results.findings.chatPatterns = Array.from(chatPatterns.messageContainers).map(el => ({
    tagName: el.tagName,
    className: el.className,
    id: el.id,
    children: el.children.length
  }));

  console.log('Chat UI patterns:', results.findings.chatPatterns);

  // 7. Generate summary
  const summary = {
    totalInputElements: inputElements.length,
    totalButtons: buttons.length,
    totalForms: forms.length,
    hasContentEditable: inputElements.some(el => el.contenteditable === 'true'),
    hasTextareas: inputElements.some(el => el.tagName === 'TEXTAREA'),
    hasRoleTextbox: inputElements.some(el => el.role === 'textbox'),
    platform: window.location.hostname
  };

  results.summary = summary;
  console.log('📊 Investigation Summary:', summary);

  return results;
}

// Run the investigation
const investigationResults = investigatePage();

// Save results to window for easy access
window.secureGPTInvestigation = investigationResults;

console.log('✅ Investigation complete! Results saved to window.secureGPTInvestigation');
console.log('📋 Full results:', investigationResults);

// Export function for manual use
window.investigateSecureGPT = investigatePage;
