#!/usr/bin/env bash

echo "Starting new API..."
screen -dmS new-api forever ./index.js
echo "Done."

exit 0
