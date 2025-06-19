#!/bin/bash

# Build client first
cd client
npm run build
cd ..

# Ensure workout schemes exist
cd server
node ensure-workout-schemes.js

# Start server
npm start