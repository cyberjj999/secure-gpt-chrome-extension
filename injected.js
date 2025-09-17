// Injected script to intercept form submissions at a deeper level
// This runs in the page context to catch form submissions that might bypass content scripts

(function() {
  'use strict';

  // Only run on ChatGPT pages
  if (!window.location.hostname.includes('chatgpt.com') && !window.location.hostname.includes('openai.com')) {
    return;
  }

  // Patterns for sensitive data detection (duplicated for injected context)
  const sensitivePatterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi,
    phone: /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    creditCard: /\b(?:\d[ -]*?){13,19}\b/g,
    apiKey: /\b[A-Za-z0-9]{20,}\b/g,
    ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    bankAccount: /\b\d{8,17}\b/g,
    passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
    address: /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way)\b/gi
  };

  const placeholders = {
    email: '[EMAIL_REDACTED]',
    phone: '[PHONE_REDACTED]',
    ssn: '[SSN_REDACTED]',
    creditCard: '[CREDIT_CARD_REDACTED]',
    apiKey: '[API_KEY_REDACTED]',
    ipAddress: '[IP_ADDRESS_REDACTED]',
    bankAccount: '[ACCOUNT_NUMBER_REDACTED]',
    passport: '[PASSPORT_REDACTED]',
    address: '[ADDRESS_REDACTED]'
  };

  function sanitizeData(data) {
    if (typeof data !== 'string') return data;
    
    let sanitized = data;
    for (const [type, pattern] of Object.entries(sensitivePatterns)) {
      sanitized = sanitized.replace(pattern, placeholders[type]);
    }
    return sanitized;
  }

  function isChatGPTConversationRequest(url, body) {
    // Only target ChatGPT conversation API endpoints
    return url.includes('/backend-api/conversation') || 
           url.includes('/backend-api/f/conversation') ||
           url.includes('/api/conversation');
  }

  function sanitizeConversationData(data) {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.messages && Array.isArray(parsed.messages)) {
          // Only sanitize the last message (user input)
          const lastMessage = parsed.messages[parsed.messages.length - 1];
          if (lastMessage && lastMessage.content && lastMessage.content.parts) {
            lastMessage.content.parts = lastMessage.content.parts.map(part => 
              typeof part === 'string' ? sanitizeData(part) : part
            );
          }
        }
        return JSON.stringify(parsed);
      } catch (e) {
        return sanitizeData(data);
      }
    }
    return data;
  }

  // Store original functions
  const originalFetch = window.fetch;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  // Override fetch - only for conversation requests
  window.fetch = function(resource, options = {}) {
    const url = typeof resource === 'string' ? resource : resource.url;
    
    if (isChatGPTConversationRequest(url, options.body)) {
      if (options.body && typeof options.body === 'string') {
        options.body = sanitizeConversationData(options.body);
      }
    }
    
    return originalFetch.call(this, resource, options);
  };

  // Override XMLHttpRequest send - only for conversation requests
  XMLHttpRequest.prototype.send = function(data) {
    const url = this._url || '';
    
    if (isChatGPTConversationRequest(url, data) && data) {
      if (typeof data === 'string') {
        data = sanitizeConversationData(data);
      }
    }
    
    return originalXHRSend.call(this, data);
  };

  // Store original open method to capture URL
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._url = url;
    return originalXHROpen.call(this, method, url, ...args);
  };

})();
