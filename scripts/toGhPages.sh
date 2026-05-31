#!/bin/bash

set -e

make PRINT=1 SANITIZER=1 && \
mkdir -p client/public/api && \
cp bin/api.js client/public/api/api.js && \
cp bin/api.wasm client/public/api/api.wasm && \

# Build du projet
npm run build

# Création du dossier cible
mkdir -p draft/tmp

# Copies des fichiers
cp client/index.html draft/tmp/index.html
cp client/index.css draft/tmp/index.css
cp -r client/public/assets draft/tmp
cp bin/api.js draft/tmp/api.js
cp bin/api.wasm draft/tmp/api.wasm
cp dist/bundle.js draft/tmp/bundle.js

# Changement de branche git
git switch gh-pages

# Copies

cp draft/tmp/index.css index.css
cp -r draft/tmp/assets public
cp -r draft/tmp/api.js public/api/api.js
cp -r draft/tmp/api.wasm public/api/api.wasm
cp -r draft/tmp/bundle.js public/bundle.js

