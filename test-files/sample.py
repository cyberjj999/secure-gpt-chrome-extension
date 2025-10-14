# Python File Test for SecureGPT

import os
import json

# User configuration with sensitive data
USER_CONFIG = {
    "name": "Frank Wilson",
    "email": "frank.wilson@company.com",
    "phone": "+1 (555) 555-1234",
    "ssn": "456-78-9012",
    "address": {
        "street": "321 Pine Street",
        "city": "Anytown",
        "state": "ST",
        "zip": "12345"
    }
}

# API configuration
API_CONFIG = {
    "api_key": "sk-live-1234567890abcdef1234567890abcdef",
    "api_url": "https://api.company.com/v1",
    "api_secret": "secret_api_key_123456789"
}

# Server configuration
SERVER_CONFIG = {
    "host": "192.168.1.100",
    "port": 8080,
    "database": "172.16.0.10:5432",
    "backup": "10.0.0.5"
}

# Financial data
FINANCIAL_DATA = {
    "credit_card": "4532-1234-5678-9012",
    "bank_account": "9876543210987654",
    "payment_api_key": "sk-live-payment-1234567890abcdef"
}

# Database connection string
DATABASE_URL = "postgresql://admin:secret123@172.16.0.10:5432/production_db"

# API endpoint
API_ENDPOINT = "https://192.168.1.100:8080/api/v1/users"

def process_user_data(user):
    """Process user data with sensitive information"""
    print(f"Processing user: {user['email']}")
    print(f"Phone: {user['phone']}")
    print(f"SSN: {user['ssn']}")
    print(f"Address: {user['address']['street']}, {user['address']['city']}, {user['address']['state']} {user['address']['zip']}")

# This Python file contains sensitive information for testing SecureGPT
if __name__ == "__main__":
    process_user_data(USER_CONFIG)
