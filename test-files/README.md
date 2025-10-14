# SecureGPT Test Files

This directory contains test files in various formats to demonstrate SecureGPT's file drop detection capabilities.

## Test Files Included

### Text Files
- **sample.txt** - Plain text file with sensitive data
- **sample.md** - Markdown file with sensitive data
- **sample.csv** - CSV file with user data including emails, phones, SSNs, credit cards
- **sample.json** - JSON file with user profile and financial information
- **sample.log** - Log file with API keys, IP addresses, and sensitive data
- **sample.conf** - Configuration file with database credentials and API keys
- **sample.ini** - INI configuration file with sensitive settings

### Code Files
- **sample.js** - JavaScript file with user data and API configurations
- **sample.py** - Python file with user data and database connections
- **sample.html** - HTML file with embedded sensitive data
- **sample.xml** - XML configuration file with user and financial data
- **sample.yaml** - YAML file with user configuration and sensitive data

## Sensitive Data Types Tested

Each file contains various types of sensitive information:

- **Email Addresses**: Multiple email formats
- **Phone Numbers**: US and international formats
- **Social Security Numbers**: Various SSN formats
- **Credit Card Numbers**: Different credit card patterns
- **Bank Account Numbers**: Account number patterns
- **API Keys**: Various API key formats
- **IP Addresses**: Different IP address formats
- **Street Addresses**: Complete address information

## How to Test

1. **Load the SecureGPT extension** in Chrome
2. **Navigate to ChatGPT or Claude**
3. **Drag and drop any of these test files** into the input field
4. **Observe the alerts and notifications** as SecureGPT detects sensitive data
5. **Check the console** for detailed detection logs

## Expected Behavior

When you drop these files, you should see:

- **Immediate drop alert** with file information
- **Processing progress indicator** showing file analysis
- **Sensitive data notifications** for each pattern found
- **Final summary** of total sensitive data detected
- **Enhanced notifications** with color-coded results

## File Format Support

These test files demonstrate support for:

- **Text Files**: .txt, .md, .csv, .json, .log, .conf, .ini
- **Code Files**: .js, .py, .html, .xml, .yaml
- **Document Files**: .pdf, .doc, .docx, .rtf (when converted to text)

## Notes

- All files contain **fictional sensitive data** for testing purposes
- Files are designed to trigger **multiple detection patterns**
- Each file format tests **different parsing capabilities**
- Files demonstrate **comprehensive sensitive data coverage**

## Security

- Files contain **test data only** - no real sensitive information
- All data is **fictional and for testing purposes**
- Files are **safe to share** for demonstration purposes
