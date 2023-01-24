#!/bin/bash
set -e

echo -e $1
node scripts/build-details.js $1
npm run build
git add .
git commit -m "chore: Update build-details for new version"
git push