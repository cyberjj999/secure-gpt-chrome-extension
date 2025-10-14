
# Robust UI Injection for Browser Extensions

**Goal**: Inject UI widgets (buttons, badges, modals) into AI chat platforms that survive layout changes, SPA navigation, and site updates.

**Target Platforms**: ChatGPT, Claude, Gemini, and other AI chat interfaces.

## Quick Start

```javascript
// Basic injection with Shadow DOM isolation
function injectButton(targetElement) {
  const host = document.createElement('div');
  host.style.cssText = 'position: absolute; z-index: 2147483647;';
  
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      .securegpt-btn { 
        width: 32px; height: 32px; 
        background: #667eea; border: none; 
        border-radius: 6px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
      }
    </style>
    <button class="securegpt-btn">🛡️</button>
  `;
  
  positionButton(targetElement, host);
  document.body.appendChild(host);
}
```

## Table of Contents
1. [Core Challenges](#core-challenges)
2. [Finding Target Elements](#finding-target-elements)
3. [Shadow DOM Isolation](#shadow-dom-isolation)
4. [Positioning & Layout](#positioning--layout)
5. [Mutation Resilience](#mutation-resilience)
6. [Platform-Specific Adapters](#platform-specific-adapters)
7. [Fallback Strategies](#fallback-strategies)
8. [Debugging & Testing](#debugging--testing)
9. [Complete Implementation](#complete-implementation)

## Core Challenges

When injecting UI into AI chat platforms, you face these key challenges:

- **DOM Structure Changes**: Sites update frequently, breaking your selectors
- **CSS Conflicts**: Host page styles override your UI
- **Layout Shifts**: Dynamic content displaces your widget
- **SPA Navigation**: Content re-renders without page reloads
- **Performance**: Observers must be lightweight
- **Accessibility**: Screen readers and keyboard navigation

## Finding Target Elements

### Smart Element Detection

```javascript
function findInputElements() {
const selectors = [
    'textarea[placeholder*="message" i]',
    'div[contenteditable="true"]',
    'div[role="textbox"]',
    'textarea[id*="prompt"]',
    'textarea[id*="input"]'
  ];
  
  const candidates = document.querySelectorAll(selectors.join(','));
  return Array.from(candidates).filter(el => {
  const rect = el.getBoundingClientRect();
    return rect.width > 200 && rect.height > 30;
  });
}

function scoreElement(element) {
  let score = 0;
  const rect = element.getBoundingClientRect();
  
  // Size scoring
  if (rect.width > 300) score += 2;
  if (rect.height > 50) score += 2;
  
  // Type scoring
  if (element.tagName === 'TEXTAREA') score += 1;
  if (element.getAttribute('role') === 'textbox') score += 1;
  if (element.closest('form')) score += 1;
  
  return score;
}
```

## Shadow DOM Isolation

### Why Shadow DOM?

Shadow DOM prevents CSS conflicts and provides style encapsulation:

```javascript
function createIsolatedButton() {
  const host = document.createElement('div');
  host.style.cssText = `
    position: absolute;
    z-index: 2147483647;
    pointer-events: auto;
  `;
  
  const shadow = host.attachShadow({ mode: 'open' });
  
  // Inject styles into shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    .securegpt-btn {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
    }
    .securegpt-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    }
  `;
  shadow.appendChild(style);
  
  // Create button
  const button = document.createElement('button');
  button.className = 'securegpt-btn';
  button.innerHTML = '🛡️';
  button.title = 'SecureGPT: Click to open menu';
  
  shadow.appendChild(button);
  return { host, button };
}
```

## Positioning & Layout

### Dynamic Positioning

```javascript
function positionButton(targetElement, buttonHost) {
  const updatePosition = () => {
    const rect = targetElement.getBoundingClientRect();
    
    // Hide if element is not visible
    if (rect.width === 0 || rect.height === 0) {
      buttonHost.style.display = 'none';
      return;
    }
    
    buttonHost.style.display = 'block';
    
    // Position relative to target element
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const padding = 8;
    
    buttonHost.style.left = `${scrollX + rect.right - 40}px`;
    buttonHost.style.top = `${scrollY + rect.top + padding}px`;
  };
  
  updatePosition();
  
  // Watch for changes
  const resizeObserver = new ResizeObserver(updatePosition);
  resizeObserver.observe(targetElement);
  
  const intersectionObserver = new IntersectionObserver(updatePosition);
  intersectionObserver.observe(targetElement);
  
  window.addEventListener('scroll', updatePosition, { passive: true });
  window.addEventListener('resize', updatePosition);
  
  return { updatePosition, resizeObserver, intersectionObserver };
}
```

## Mutation Resilience

### Handling Dynamic Changes

```javascript
function setupMutationObserver(targetElement, buttonHost) {
  const mutationObserver = new MutationObserver((mutations) => {
    let needsUpdate = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        needsUpdate = true;
      break;
    }
  }
    
    if (needsUpdate) {
      requestAnimationFrame(() => {
        // Check if target element still exists
        if (!document.contains(targetElement)) {
          buttonHost.remove();
          return;
        }
        
        // Reposition button
        positionButton(targetElement, buttonHost);
      });
    }
  });
  
  // Observe the entire document for changes
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  
  return mutationObserver;
}
```

## Platform-Specific Adapters

### AI Platform Detection

```javascript
const platformAdapters = {
  chatgpt: {
    test: () => location.hostname.includes('openai.com') || location.hostname.includes('chatgpt.com'),
    selectors: ['#prompt-textarea', 'textarea[placeholder*="message" i]'],
    buttonPlacement: 'before-send-button'
  },
  
  claude: {
    test: () => location.hostname.includes('claude.ai'),
    selectors: ['div[contenteditable="true"]', 'div[role="textbox"]'],
    buttonPlacement: 'floating'
  },
  
  gemini: {
    test: () => location.hostname.includes('gemini.google.com'),
    selectors: ['textarea', 'div[contenteditable="true"]'],
    buttonPlacement: 'inline'
  }
};

function findTargetElement() {
  // Try platform-specific adapters first
  for (const [platform, adapter] of Object.entries(platformAdapters)) {
    if (adapter.test()) {
      for (const selector of adapter.selectors) {
        const element = document.querySelector(selector);
        if (element && isVisible(element)) {
          console.log(`Found ${platform} element:`, selector);
          return element;
        }
      }
    }
  }
  
  // Fallback to generic detection
  const candidates = findInputElements();
  if (candidates.length === 0) return null;
  
  // Score and pick best candidate
  const scored = candidates.map(el => ({
    element: el,
    score: scoreElement(el)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0].element;
}
```

## Fallback Strategies

### When Primary Injection Fails

```javascript
function createFloatingFallback() {
  const fallback = document.createElement('div');
  fallback.id = 'securegpt-fallback';
  fallback.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: transform 0.2s;
  `;
  
  fallback.innerHTML = '🛡️';
  fallback.title = 'SecureGPT: Click to open menu';
  
  fallback.addEventListener('click', (e) => {
    e.stopPropagation();
    // Open your modal or trigger action
    openSecureGPTModal();
  });
  
  document.body.appendChild(fallback);
  return fallback;
}

function createContextMenu() {
  // Add right-click context menu for editable elements
  const contextMenu = document.createElement('div');
  contextMenu.id = 'securegpt-context-menu';
  contextMenu.style.cssText = `
    position: fixed;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2147483647;
    display: none;
    padding: 8px 0;
  `;
  
  const menuItem = document.createElement('div');
  menuItem.textContent = '🛡️ Clean PII';
  menuItem.style.cssText = `
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
  `;
  menuItem.addEventListener('click', () => {
    const activeElement = document.activeElement;
    if (activeElement && isEditable(activeElement)) {
      cleanPII(activeElement);
    }
    contextMenu.style.display = 'none';
  });
  
  contextMenu.appendChild(menuItem);
  document.body.appendChild(contextMenu);
  
  // Show context menu on right-click
  document.addEventListener('contextmenu', (e) => {
    if (isEditable(e.target)) {
      e.preventDefault();
      contextMenu.style.display = 'block';
      contextMenu.style.left = `${e.clientX}px`;
      contextMenu.style.top = `${e.clientY}px`;
    }
  });
  
  // Hide on click outside
  document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
  });
}
```

## Debugging & Testing

### Debug Console

```javascript
function setupDebugging() {
  // Add debug info to console
  window.secureGPTDebug = {
    findTargets: () => {
      const targets = findInputElements();
      console.log('Found input elements:', targets);
      return targets;
    },
    
    testInjection: () => {
      const target = findTargetElement();
      if (target) {
        console.log('Target element:', target);
        const button = createIsolatedButton();
        positionButton(target, button.host);
        document.body.appendChild(button.host);
        console.log('Button injected successfully');
      } else {
        console.log('No target element found');
      }
    },
    
    checkObservers: () => {
      console.log('Active observers:', {
        resize: window.secureGPTResizeObserver,
        intersection: window.secureGPTIntersectionObserver,
        mutation: window.secureGPTMutationObserver
      });
    }
  };
  
  console.log('SecureGPT Debug Tools Available:');
  console.log('- secureGPTDebug.findTargets()');
  console.log('- secureGPTDebug.testInjection()');
  console.log('- secureGPTDebug.checkObservers()');
}
```

### Testing Checklist

```javascript
function runInjectionTests() {
  const tests = [
    {
      name: 'Element Detection',
      test: () => findInputElements().length > 0
    },
    {
      name: 'Button Creation',
      test: () => {
        const button = createIsolatedButton();
        return button && button.host && button.button;
      }
    },
    {
      name: 'Positioning',
      test: () => {
        const target = findTargetElement();
        if (!target) return false;
        const button = createIsolatedButton();
        positionButton(target, button.host);
        return button.host.style.display !== 'none';
      }
    },
    {
      name: 'Shadow DOM Isolation',
      test: () => {
        const button = createIsolatedButton();
        return button.host.shadowRoot !== null;
      }
    }
  ];
  
  console.log('Running SecureGPT Injection Tests:');
  tests.forEach(test => {
    const result = test.test();
    console.log(`${test.name}: ${result ? '✅ PASS' : '❌ FAIL'}`);
  });
}
```

## Complete Implementation

### Full Working Example

```javascript
class SecureGPTInjection {
  constructor() {
    this.attachedElements = new WeakSet();
    this.observers = new Map();
    this.setupDebugging();
  }
  
  async init() {
    console.log('SecureGPT: Initializing injection system');
    
    // Initial scan
    this.scanAndInject();
    
    // Watch for new elements
    this.setupMutationObserver();
    
    // Handle SPA navigation
    this.setupNavigationWatcher();
    
    // Create fallback UI
    this.createFloatingFallback();
  }
  
  scanAndInject() {
    const targetElement = findTargetElement();
    if (targetElement && !this.attachedElements.has(targetElement)) {
      this.injectButton(targetElement);
    }
  }
  
  injectButton(targetElement) {
    console.log('SecureGPT: Injecting button for element:', targetElement);
    
    // Create isolated button
    const button = createIsolatedButton();
    
    // Position button
    const positioning = positionButton(targetElement, button.host);
    
    // Add to DOM
    document.body.appendChild(button.host);
    
    // Setup observers
    const mutationObserver = setupMutationObserver(targetElement, button.host);
    
    // Store references
    this.attachedElements.add(targetElement);
    this.observers.set(targetElement, {
      button,
      positioning,
      mutationObserver
    });
    
    // Add click handler
    button.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openSecureGPTModal();
    });
    
    console.log('SecureGPT: Button injected successfully');
  }
  
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let needsRescan = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          needsRescan = true;
      break;
    }
  }
      
      if (needsRescan) {
        setTimeout(() => this.scanAndInject(), 100);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  setupNavigationWatcher() {
    // Handle SPA navigation
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(() => this.scanAndInject(), 100);
    }.bind(this);
    
    window.addEventListener('popstate', () => {
      setTimeout(() => this.scanAndInject(), 100);
    });
  }
  
  openSecureGPTModal() {
    // Your modal implementation
    console.log('SecureGPT: Opening modal');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SecureGPTInjection().init();
  });
} else {
  new SecureGPTInjection().init();
}
```

### Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "SecureGPT",
  "content_scripts": [
    {
      "matches": [
        "https://chat.openai.com/*",
        "https://claude.ai/*",
        "https://gemini.google.com/*"
      ],
      "js": ["content-script.js"],
      "run_at": "document_idle"
    }
  ],
  "permissions": ["activeTab", "storage"],
  "host_permissions": [
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*"
  ]
}
```

### Performance Tips

1. **Throttle Observers**: Use `requestAnimationFrame` for positioning updates
2. **Limit Scope**: Don't observe the entire document unless necessary
3. **Cleanup**: Remove observers when elements are detached
4. **Debounce**: Use debounced functions for resize/scroll events
5. **Test Performance**: Monitor CPU usage during development

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Button not appearing | Check console logs, verify element detection |
| Button disappears | Ensure observers are properly set up |
| CSS conflicts | Use Shadow DOM for style isolation |
| Performance issues | Throttle observers, limit scope |
| SPA navigation | Watch for history changes |

This guide provides a robust foundation for UI injection in browser extensions. Adapt the code to your specific needs and test thoroughly across different platforms.

