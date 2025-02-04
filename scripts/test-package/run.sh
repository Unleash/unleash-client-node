#!/bin/bash
set -e

TEST_DIR="test-package"
mkdir "$TEST_DIR"

cp scripts/test-package/test-tsconfig.json "$TEST_DIR/tsconfig.json"
cp scripts/test-package/test-package.json "$TEST_DIR/package.json"
cd "$TEST_DIR"
npm install --install-links
mkdir src
echo -e "import { Unleash } from 'unleash-client';\nvoid Unleash;\nconsole.log('Hello world');" > src/index.ts
./node_modules/.bin/tsc -b tsconfig.json

if [ "$(node . 2>&1)" = "Hello world" ]; then
  echo "Output is correct"
  (cd .. && rm -rf "$TEST_DIR")
else
  echo "Output is incorrect" >&2
  echo $(node . 2>&1)
  (cd .. && rm -rf "$TEST_DIR")
  exit 1
fi
