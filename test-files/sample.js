// JavaScript File Test for SecureGPT

const userConfig = {
    name: "Emma Davis",
    email: "emma.davis@company.com",
    phone: "+1 (555) 987-6543",
    ssn: "987-65-4321",
    address: {
        street: "789 Oak Street",
        city: "Springfield",
        state: "IL",
        zip: "62701"
    }
};

const apiConfig = {
    apiKey: "sk-live-1234567890abcdef1234567890abcdef",
    apiUrl: "https://api.company.com/v1",
    apiSecret: "secret_api_key_123456789"
};

const serverConfig = {
    host: "192.168.1.100",
    port: 8080,
    database: "172.16.0.10:5432",
    backup: "10.0.0.5"
};

const financialData = {
    creditCard: "4532-1234-5678-9012",
    bankAccount: "9876543210987654",
    paymentApiKey: "sk-live-payment-1234567890abcdef"
};

// Function to process sensitive data
function processUserData(user) {
    console.log(`Processing user: ${user.email}`);
    console.log(`Phone: ${user.phone}`);
    console.log(`SSN: ${user.ssn}`);
    console.log(`Address: ${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.zip}`);
}

// API endpoint with sensitive data
const apiEndpoint = "https://192.168.1.100:8080/api/v1/users";
const databaseUrl = "postgresql://admin:secret123@172.16.0.10:5432/production_db";

// This JavaScript file contains sensitive information for testing SecureGPT
console.log("JavaScript file with sensitive data loaded");
