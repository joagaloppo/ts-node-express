#!/bin/bash

# Navigate to the project directory
cd ~/ts-node-express

# Pull the latest code
git pull origin main

# Install new packages
npm install

# Build the project
npm run build

# Restart PM2
npx pm2 restart all
