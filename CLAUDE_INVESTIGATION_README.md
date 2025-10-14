# Claude.ai DOM Investigation

This script helps us understand the actual DOM structure of Claude.ai to improve our SecureGPT extension's injection logic.

## How to Use

1. **Navigate to Claude.ai** in your browser
2. **Open the browser console** (F12 → Console tab)
3. **Copy and paste the entire contents** of `claude-investigation.js` into the console
4. **Press Enter** to run the script
5. **Review the results** in the console

## What the Script Does

The investigation script performs the following checks:

1. **Input Elements**: Searches for all potential input fields including:
   - Textareas
   - ContentEditable divs
   - Elements with `role="textbox"`
   - Elements with `data-testid` and `data-cy` attributes

2. **Send Buttons**: Looks for submit/send buttons that might be associated with the chat input

3. **Forms**: Identifies any form elements that might contain the input

4. **Chat Containers**: Finds the main chat/conversation areas

5. **Page Context**: Determines if you're on a chat page vs. landing page

## Expected Findings for Claude.ai

Based on the initial HTML analysis, we expect to find:
- A `contenteditable="true"` div for the main input field
- Possibly a `data-testid` or similar attribute on the input element
- A send/submit button near the input field

## Next Steps

After running the investigation:

1. **Share the console output** with the developer
2. **Identify the main input element** from the results
3. **Update the platform adapters** in `content-simple.js` with the correct selectors
4. **Test the extension** on Claude.ai

## Troubleshooting

If the script doesn't find any input elements:
- Make sure you're on a chat page (not the landing page)
- Try refreshing the page and running the script again
- The input field might be loaded asynchronously - try running the script after a few seconds

## Sample Output

The script will output something like:

```
🔍 Starting Claude.ai DOM Investigation...
📊 Investigation Results: {
  timestamp: "2025-01-14T10:30:00.000Z",
  url: "https://claude.ai/chat/...",
  hostname: "claude.ai",
  findings: {
    inputElements: [...],
    sendButtons: [...],
    forms: [...],
    chatContainers: [...],
    isChatPage: true,
    bodyStructure: {...}
  }
}
```
