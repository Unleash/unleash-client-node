#!/bin/bash
set -e

echo -e $1
node scripts/build-details.js $1
npm run build
git add .