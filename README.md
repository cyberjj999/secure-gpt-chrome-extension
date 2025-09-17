# SecureGPT Chrome Extension 🛡️

A Chrome extension that automatically detects and replaces sensitive information (PII, credit cards, API keys, etc.) with placeholders when interacting with ChatGPT, protecting your privacy during AI conversations.

## 🚀 Features

- **Real-time Detection**: Automatically scans text as you type or paste into ChatGPT
- **Comprehensive Coverage**: Detects 9 types of sensitive information:
  - Email addresses
  - Phone numbers
  - Social Security Numbers (SSN)
  - Credit card numbers
  - API keys
  - IP addresses
  - Bank account numbers
  - Passport numbers
  - Street addresses

- **Automatic Replacement**: Replaces detected sensitive data with safe placeholders
- **Customizable**: Enable/disable specific detection patterns
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
2. **Navigate to ChatGPT** (chat.openai.com or chatgpt.com)
3. **Look for the shield badge** 🛡️ in your extension toolbar - this indicates SecureGPT is active
4. **Two ways to protect your data:**
   - **Auto-scan**: Type or paste content and sensitive information is automatically replaced
   - **Manual De-PII**: Click the 🛡️ button next to the send button to manually sanitize text before sending
5. **Watch as sensitive information is replaced** with placeholders like `[EMAIL_REDACTED]`, `[CREDIT_CARD_REDACTED]`, etc.

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

### Main Settings
- **Enable Protection**: Toggle the entire extension on/off
- **Show Notifications**: Get visual feedback when sensitive data is detected
- **Auto-scan while typing**: Automatically scan and replace sensitive data as you type (can be disabled for manual-only mode)

### Detection Patterns
Enable or disable detection for specific types of sensitive information:
- ✅ Email Addresses
- ✅ Phone Numbers  
- ✅ Social Security Numbers
- ✅ Credit Card Numbers
- ✅ API Keys
- ✅ IP Addresses
- ✅ Bank Account Numbers
- ✅ Passport Numbers
- ✅ Street Addresses

## 🔒 Privacy & Security

- **100% Local Processing**: All sensitive data detection happens in your browser
- **No Data Collection**: SecureGPT never sends your data to external servers
- **No Storage**: Sensitive information is immediately replaced and never stored
- **Open Source**: Full source code is available for review
- **Minimal Permissions**: Only requests necessary permissions for ChatGPT interaction

## 🛠️ Technical Details

### How It Works
1. **Content Script Injection**: Monitors textarea inputs on ChatGPT pages
2. **Pattern Matching**: Uses regex patterns to identify sensitive information
3. **Real-time Replacement**: Replaces detected patterns with placeholders
4. **Form Interception**: Catches submissions at multiple levels (paste, input, submit)
5. **Deep Integration**: Includes injected scripts to catch API calls and XHR requests

### Supported Websites
- chat.openai.com
- chatgpt.com

### Detection Patterns
The extension uses carefully crafted regex patterns to detect:

```javascript
email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi
phone: /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g
ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g
creditCard: /\b(?:\d[ -]*?){13,19}\b/g
// ... and more
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
A: Currently, SecureGPT is specifically designed for ChatGPT. Support for other AI platforms may be added in future versions.

**Q: Will this affect ChatGPT's functionality?**
A: No, ChatGPT will work normally. The extension only replaces sensitive data with placeholders, maintaining the context of your conversation.

**Q: Can I customize the placeholder text?**
A: Currently, placeholder text is fixed (e.g., `[EMAIL_REDACTED]`). Custom placeholders may be added in future versions.

**Q: Does this work on mobile?**
A: This is a Chrome extension for desktop browsers. Mobile support would require a different approach.

**Q: Is my data safe?**
A: Yes! All processing happens locally in your browser. No data is sent to external servers or stored anywhere.

---

**Stay secure, chat confidently!** 🛡️✨
