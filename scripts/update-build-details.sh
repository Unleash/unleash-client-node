#!/bin/bash
set -e

node scripts/build-details.js $1
npm run build
git add .
git commit -m "chore: Update build-details"