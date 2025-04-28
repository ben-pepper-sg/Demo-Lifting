#!/bin/bash

# Build client first
cd client
npm run build
cd ..

# Start server
cd server
npm start