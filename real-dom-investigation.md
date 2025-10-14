# Real DOM Investigation for SecureGPT

## The Problem
We need to understand the **actual** DOM structure of these AI platforms, but they're JavaScript-heavy SPAs that don't show their real structure in simple GET requests.

## Target Sites (from manifest.json):
- **ChatGPT**: https://chat.openai.com/*, https://chatgpt.com/*
- **Claude**: https://claude.ai/*
- **Gemini**: https://gemini.google.com/*
- **Meta AI**: https://ai.meta.com/*
- **Mistral**: https://mistral.ai/*
- **xAI**: https://x.ai/*
- **Cohere**: https://cohere.com/*
- **Perplexity**: https://www.perplexity.ai/*
- **DeepSeek**: https://chat.deepseek.com/*

## Practical Investigation Approach

### Method 1: Browser Developer Tools
1. **Open each site in browser**
2. **Open DevTools (F12)**
3. **Inspect the input field and send button**
4. **Copy the actual selectors**

### Method 2: Content Script Investigation
Since we already have a content script running on these sites, we can use it to investigate the real DOM structure.

### Method 3: Web Scraping with JavaScript Execution
Use tools like Puppeteer to render the pages and extract the real DOM.

## What We Need to Find

For each platform, we need:

### Input Field:
- **Tag**: `<textarea>`, `<div>`, `<input>`?
- **ID**: What's the actual ID?
- **Classes**: What are the real class names?
- **Attributes**: `placeholder`, `role`, `aria-label`?
- **Selector**: What selector actually works?

### Send Button:
- **Tag**: `<button>`?
- **Classes**: What are the real class names?
- **Attributes**: `aria-label`, `data-testid`?
- **Text**: What's the button text?
- **Selector**: What selector actually works?

### Container:
- **Parent**: What wraps the input and button?
- **Form**: Is there a `<form>` element?
- **Classes**: What are the container classes?

## Current Status: ❌ NOT INVESTIGATED

We need to actually visit these sites and inspect their real DOM structure.

## Next Steps:
1. **Visit each site manually** and inspect the DOM
2. **Document the real selectors** that actually work
3. **Update our code** with the real findings
4. **Test injection** with real selectors

## Why This Matters:
- **Our current selectors might be wrong**
- **Platforms change their DOM structure**
- **We need real selectors for reliable injection**
- **Assumptions lead to broken functionality**

## Investigation Script
We can add this to our content script to investigate the real DOM:

```javascript
// Add this to content-simple.js for investigation
function investigateRealDOM() {
  console.log('🔍 Investigating real DOM structure...');
  
  // Find all textareas
  const textareas = document.querySelectorAll('textarea');
  console.log('Textareas found:', textareas);
  
  // Find all contenteditable divs
  const contentEditable = document.querySelectorAll('[contenteditable="true"]');
  console.log('Contenteditable divs:', contentEditable);
  
  // Find all buttons
  const buttons = document.querySelectorAll('button');
  console.log('Buttons found:', buttons);
  
  // Find forms
  const forms = document.querySelectorAll('form');
  console.log('Forms found:', forms);
  
  // Look for specific patterns
  const patterns = {
    textareaWithPlaceholder: document.querySelectorAll('textarea[placeholder]'),
    buttonWithAriaLabel: document.querySelectorAll('button[aria-label]'),
    buttonWithDataTestId: document.querySelectorAll('button[data-testid]'),
    divWithRoleTextbox: document.querySelectorAll('div[role="textbox"]')
  };
  
  console.log('Patterns found:', patterns);
  
  return {
    textareas: Array.from(textareas).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className,
      placeholder: el.placeholder,
      rect: el.getBoundingClientRect()
    })),
    buttons: Array.from(buttons).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className,
      text: el.textContent.trim(),
      ariaLabel: el.getAttribute('aria-label'),
      dataTestId: el.getAttribute('data-testid'),
      rect: el.getBoundingClientRect()
    })),
    forms: Array.from(forms).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className
    }))
  };
}

// Run investigation
window.secureGPTInvestigation = investigateRealDOM();
```

## Conclusion
We need to actually investigate the real DOM structure of these platforms instead of making assumptions. The investigation script above can help us understand what's actually there.
