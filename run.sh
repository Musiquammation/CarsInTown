#!/bin/bash

make PRINT=1 SANITIZER=1 && \
mkdir -p client/public/api && \
cp bin/api.js client/public/api/api.js && \
cp bin/api.wasm client/public/api/api.wasm && \
npm run client