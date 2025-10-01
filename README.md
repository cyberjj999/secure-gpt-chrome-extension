# SecureGPT Chrome Extension 🛡️

A Chrome extension that automatically detects and removes sensitive information (PII, credit cards, API keys, etc.) when users are interacting with AI chat platforms, protecting their privacy during AI conversations.

## 🚀 Features

- **Multi-Platform Support**: Works on 8+ AI chat platforms including ChatGPT, Claude, Gemini, LLaMA, Mistral AI, Grok, Cohere, and Perplexity AI
- **Real-time Detection**: Automatically scans text as you type or paste into AI chat platforms
- **Comprehensive Coverage**: Detects 11 types of sensitive information:
  - Email addresses
  - Phone numbers (US and international)
  - Social Security Numbers (SSN)
  - Credit card numbers (specific and generic patterns)
  - API keys
  - IP addresses
  - Bank account numbers
  - Passport numbers
  - Street addresses

- **Automatic Replacement**: Replaces detected sensitive data with customizable placeholders
- **Auto-Save Settings**: All configuration changes save automatically with visual notifications
- **Customizable Placeholders**: Set your own replacement text for each pattern type
- **Custom Detection Patterns**: Add your own text patterns and advanced regex patterns for custom detection
- **Website Management**: Enable/disable protection on specific AI platforms
- **Ignore List**: Add specific text patterns that should never be redacted
- **Test Detection**: Live testing of detection patterns with instant feedback
- **Non-intrusive**: Works seamlessly in the background
- **Privacy-focused**: All processing happens locally in your browser
- **Visual Feedback**: Optional notifications when sensitive data is detected

## 📦 Installation

### Method 1: Chrome Web Store (Coming Soon)
*Extension will be available on the Chrome Web Store once reviewed by Google*

### Method 2: Developer Mode (Current)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The SecureGPT extension should now appear in your extensions list

## 🎯 Usage

1. **Install the extension** following the steps above
2. **Navigate to any supported AI platform** (ChatGPT, Claude, Gemini, etc.)
3. **Look for the shield badge** 🛡️ in your extension toolbar - this indicates SecureGPT is active
4. **Two ways to protect your data:**
   - **Auto-scan**: Type or paste content and sensitive information is automatically replaced
   - **Manual De-PII**: Click the 🛡️ button next to the send button to manually sanitize text before sending
5. **Watch as sensitive information is replaced** with customizable placeholders like `[EMAIL_REDACTED]`, `[CREDIT_CARD_REDACTED]`, etc.

### Example

**Before SecureGPT:**
```
Hi ChatGPT, my email is john.doe@company.com and my credit card number is 4111 1111 1111 1111. 
Can you help me with my account at 123 Main Street?
```

**After SecureGPT:**
```
Hi ChatGPT, my email is [EMAIL_REDACTED] and my credit card number is [CREDIT_CARD_REDACTED]. 
Can you help me with my account at [ADDRESS_REDACTED]?
```

## ⚙️ Configuration

Click on the SecureGPT icon in your Chrome toolbar to access settings:

### Popup Settings (Quick Access)
- **Enable Protection**: Toggle the entire extension on/off
- **Show Notifications**: Get visual feedback when sensitive data is detected
- **Auto-scan while typing**: Automatically scan and replace sensitive data as you type
- **Detection Patterns Overview**: See all enabled patterns at a glance
- **Open Full Configuration Page**: Access comprehensive settings

### Full Configuration Page
Click "Open Full Configuration Page" for advanced settings:

#### General Settings
- **Enable Protection**: Toggle the entire extension on/off
- **Show Notifications**: Get visual feedback when sensitive data is detected
- **Auto-scan while typing**: Automatically scan and replace sensitive data as you type

#### Website Management
Choose which AI platforms to protect:
- ✅ ChatGPT (chat.openai.com, chatgpt.com)
- ✅ Claude (claude.ai)
- ✅ Gemini (gemini.google.com)
- ✅ LLaMA (ai.meta.com)
- ✅ Mistral AI (mistral.ai)
- ✅ Grok (x.ai)
- ✅ Cohere (cohere.com)
- ✅ Perplexity AI (perplexity.ai)

#### Detection Patterns
Enable or disable detection for specific types of sensitive information:
- ✅ Email Addresses
- ✅ Phone Numbers (US and International)
- ✅ Social Security Numbers
- ✅ Credit Card Numbers (Specific and Generic)
- ✅ API Keys
- ✅ IP Addresses
- ✅ Bank Account Numbers
- ✅ Passport Numbers
- ✅ Street Addresses

#### Custom Placeholders
Set your own replacement text for each pattern type:
- Email: `[EMAIL_REDACTED]` (customizable)
- Phone: `[PHONE_REDACTED]` (customizable)
- Credit Card: `[CREDIT_CARD_REDACTED]` (customizable)
- And more...

#### Test Detection
Live testing of detection patterns with instant feedback:
- Enter test text in any pattern's test field
- Click "Test" to see if it would be detected
- Get immediate feedback on detection results

#### Custom Detection Patterns
Add your own text patterns for custom detection:
- **Specific Text & Phrases**: Add exact text or phrases that should be replaced with placeholders. Perfect for company names, internal project codes, or any specific sensitive information
- **Advanced Pattern Matching (Regex)**: For technical users - add custom regex patterns to detect and replace content matching specific patterns. Great for complex formats like employee IDs, internal codes, or structured data
- **Pattern Testing**: Test your regex patterns before adding them to ensure they work correctly
- **Easy Management**: Add, remove, and manage your custom patterns with a simple interface

#### Ignore List
Add specific text patterns that should never be redacted:
- Add test emails, sample data, or company-specific patterns
- These patterns will never be replaced, even if they match detection rules
- Easy add/remove functionality

## 🔒 Privacy & Security

- **100% Local Processing**: All sensitive data detection happens in your browser
- **No Data Collection**: SecureGPT never sends your data to external servers
- **No Storage**: Sensitive information is immediately replaced and never stored
- **Open Source**: Full source code is available for review
- **Minimal Permissions**: Only requests necessary permissions for AI platform interaction

## 📋 Chrome Web Store Privacy Compliance

### Single Purpose
SecureGPT has a single, narrow purpose: **automatically detect and replace sensitive information (PII, credit cards, API keys, etc.) with safe placeholders when using AI chat platforms**. This protects user privacy by preventing accidental sharing of sensitive data with AI services.

### Permission Justifications

#### activeTab Permission
**Purpose**: Required to inject content scripts into AI chat platform tabs and monitor text input fields for sensitive information detection.

**Justification**: The extension needs to access the active tab to:
- Monitor text input fields on AI chat platforms
- Inject the De-PII button into chat interfaces
- Detect and replace sensitive information in real-time
- Work across multiple AI platforms (ChatGPT, Claude, Gemini, etc.)

#### storage Permission
**Purpose**: Required to save user configuration settings and preferences.

**Justification**: The extension needs to store:
- User's detection pattern preferences (enabled/disabled patterns)
- Custom placeholder text for each data type
- Website management settings (which AI platforms to protect)
- Ignore list entries
- General settings (notifications, auto-scan, etc.)

#### Host Permissions
**Purpose**: Required to inject content scripts and access AI chat platform websites.

**Justification**: The extension requires access to these specific AI platforms:
- `https://chat.openai.com/*` and `https://chatgpt.com/*` - ChatGPT platforms
- `https://claude.ai/*` - Anthropic Claude
- `https://gemini.google.com/*` - Google Gemini
- `https://ai.meta.com/*` - Meta LLaMA
- `https://mistral.ai/*` - Mistral AI
- `https://x.ai/*` - xAI Grok
- `https://cohere.com/*` - Cohere
- `https://www.perplexity.ai/*` - Perplexity AI

Each host permission is necessary to:
- Inject content scripts for sensitive data detection
- Access text input fields on these platforms
- Provide real-time protection across all supported AI services
- Maintain consistent functionality across different AI platforms

### Remote Code Usage
**No Remote Code**: This extension does not use any remote code. All JavaScript, CSS, and HTML files are included in the extension package. No external scripts, modules, or evaluated code strings are used.

**Verification**: All code is:
- Included in the extension package
- No external script references
- No dynamic code evaluation
- No remote module imports
- No external API calls for code execution

## 🛠️ Technical Details

### How It Works
1. **Content Script Injection**: Monitors textarea inputs on ChatGPT pages
2. **Pattern Matching**: Uses regex patterns to identify sensitive information
3. **Real-time Replacement**: Replaces detected patterns with placeholders
4. **Form Interception**: Catches submissions at multiple levels (paste, input, submit)
5. **Deep Integration**: Includes injected scripts to catch API calls and XHR requests

### Supported Websites
- **ChatGPT**: chat.openai.com, chatgpt.com
- **Claude**: claude.ai
- **Gemini**: gemini.google.com
- **LLaMA**: ai.meta.com
- **Mistral AI**: mistral.ai
- **Grok**: x.ai
- **Cohere**: cohere.com
- **Perplexity AI**: perplexity.ai

### Detection Patterns
The extension uses carefully crafted regex patterns to detect:

```javascript
// Email addresses
email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi

// Phone numbers (US and international)
phone: /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g
phoneInternational: /\+[1-9]\d{1,14}\b/g

// Social Security Numbers
ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g

// Credit card numbers (specific and generic)
creditCard: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g
creditCardGeneric: /\b\d{13,19}\b/g

// API keys, IP addresses, bank accounts, passports, addresses
// ... and more sophisticated patterns
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Clone the repository
2. Make your changes
3. Test the extension in Chrome's developer mode
4. Submit a pull request

### Reporting Issues
If you find a bug or have a feature request, please open an issue on GitHub.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to the open-source community for regex patterns and Chrome extension best practices
- Inspired by the need for privacy protection in AI interactions

## 📞 Support

If you need help or have questions:
- Open an issue on GitHub
- Check the [FAQ section](#faq)

## FAQ

**Q: Does this extension work with other AI chatbots?**
A: Yes! SecureGPT now supports 8+ AI platforms including ChatGPT, Claude, Gemini, LLaMA, Mistral AI, Grok, Cohere, and Perplexity AI.

**Q: Will this affect the AI platform's functionality?**
A: No, all AI platforms will work normally. The extension only replaces sensitive data with placeholders, maintaining the context of your conversation.

**Q: Can I customize the placeholder text?**
A: Yes! You can set custom placeholder text for each pattern type in the Full Configuration Page. For example, you can change `[EMAIL_REDACTED]` to `[EMAIL_HIDDEN]` or any text you prefer.

**Q: Can I disable protection on specific websites?**
A: Yes! In the Full Configuration Page, you can enable/disable protection on specific AI platforms. This gives you granular control over where the extension is active.

**Q: What if I want to test certain data without it being redacted?**
A: Use the Ignore List feature! Add specific text patterns (like test emails or sample data) that should never be redacted, even if they match detection patterns.

**Q: Does this work on mobile?**
A: This is a Chrome extension for desktop browsers. Mobile support would require a different approach.

**Q: Is my data safe?**
A: Yes! All processing happens locally in your browser. No data is sent to external servers or stored anywhere.

**Q: Do I need to manually save my settings?**
A: No! All settings changes are automatically saved with visual notifications. You'll see a green notification confirming when your settings are saved.

---

**Stay secure, chat confidently!** 🛡️✨
