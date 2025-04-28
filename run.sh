#!/bin/bash

# Set NODE_ENV to production
export NODE_ENV=production

# Ensure we're using port 5000 for the server
export PORT=5000

echo "Starting CustoSmart application..."
cd CustoSmart-Replit

# Execute build e start diretamente
echo "Building the application..."
npm run build

echo "Starting the application..."
npm run start
