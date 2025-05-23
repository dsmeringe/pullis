#!/bin/bash

# Create SSL certificate for local development
# This script generates a self-signed SSL certificate for local development

# Create certs directory if it doesn't exist
mkdir -p certs

# Generate private key
openssl genrsa -out certs/localhost.key 2048

# Generate certificate signing request
openssl req -new -key certs/localhost.key -out certs/localhost.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in certs/localhost.csr -signkey certs/localhost.key -out certs/localhost.crt

# Set proper permissions
chmod 600 certs/localhost.key

# Create .env entry
echo "SSL_CERT_PATH=./certs/localhost.crt" >> .env
echo "SSL_KEY_PATH=./certs/localhost.key" >> .env

echo "SSL certificates generated successfully in the 'certs' directory."
echo "Make sure to add the following to your /etc/hosts file:"
echo "127.0.0.1 localhost"

echo "\nTo trust the certificate on macOS, run:"
echo "sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/localhost.crt"
