# DOM Investigation Guide for SecureGPT

## The Problem
We need to understand the **actual** DOM structure of AI chat platforms to create reliable selectors, not make assumptions.

## Investigation Process

### Step 1: Manual Investigation
1. **Open each target platform in your browser**
2. **Open Developer Tools (F12)**
3. **Run the investigation script** (copy/paste `dom-investigation.js` into console)
4. **Document the results**

### Target Platforms to Investigate:
- **ChatGPT**: https://chat.openai.com/
- **Claude**: https://claude.ai/
- **Gemini**: https://gemini.google.com/
- **DeepSeek**: https://chat.deepseek.com/
- **Perplexity**: https://www.perplexity.ai/

### Step 2: Key Questions to Answer

#### For Input Fields:
- What is the actual tag? (`<textarea>`, `<div contenteditable>`, `<input>`)
- What are the actual class names?
- What are the actual IDs?
- What attributes are present? (`placeholder`, `role`, `aria-label`)
- How is the input field structured in the DOM?

#### For Send Buttons:
- What is the actual button element?
- What are the class names and IDs?
- What is the `aria-label` or text content?
- Where is it positioned relative to the input?

#### For Containers:
- What wraps the input and button?
- Are there form elements?
- What are the parent container classes?

### Step 3: Expected Findings

Based on common patterns, we might find:

#### ChatGPT:
```html
<textarea id="prompt-textarea" placeholder="Message ChatGPT..."></textarea>
<button data-testid="send-button">Send</button>
```

#### Claude:
```html
<div contenteditable="true" role="textbox" placeholder="Message Claude..."></div>
<button aria-label="Send message">Send</button>
```

#### Gemini:
```html
<textarea placeholder="Enter a prompt here"></textarea>
<button>Send</button>
```

### Step 4: Investigation Script Usage

1. **Copy the entire `dom-investigation.js` file**
2. **Paste into browser console on each platform**
3. **Run the investigation**
4. **Copy the results**
5. **Document findings in this file**

### Step 5: Results Documentation

For each platform, document:

```markdown
## ChatGPT (chat.openai.com)

### Input Field:
- **Tag**: `<textarea>`
- **ID**: `#prompt-textarea`
- **Classes**: `...`
- **Attributes**: `placeholder="Message ChatGPT..."`
- **Selector**: `#prompt-textarea`

### Send Button:
- **Tag**: `<button>`
- **Classes**: `...`
- **Attributes**: `data-testid="send-button"`
- **Selector**: `button[data-testid="send-button"]`

### Container:
- **Parent**: `<form>` or `<div>`
- **Classes**: `...`
```

## Current Status: ❌ NOT INVESTIGATED

We need to run this investigation on each platform to get the real DOM structure.

## Next Steps:
1. Run investigation on ChatGPT
2. Run investigation on Claude  
3. Run investigation on Gemini
4. Update selectors in `content-simple.js` based on real findings
5. Test injection with real selectors

## Why This Matters:
- **Assumptions are dangerous** - we might be targeting wrong elements
- **Platforms change** - selectors break when sites update
- **Reliability** - real selectors work better than guessed ones
- **Debugging** - knowing the real structure helps troubleshoot issues
