#!/bin/bash
node scripts/build-details.js
npm run build
git add .
git commit -m "chore: Update build-details"