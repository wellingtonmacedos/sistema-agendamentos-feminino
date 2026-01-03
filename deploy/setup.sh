#!/bin/bash

# Ensure we are in the correct directory
cd /var/www/agenda || exit

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Return to root
cd ..

# Start/Restart PM2
echo "Configuring PM2..."
pm2 start ecosystem.config.js --env production
pm2 save

echo "Setup complete!"
